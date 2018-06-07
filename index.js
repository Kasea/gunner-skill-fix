const Library = require('library');
class blastFix{
    constructor(dispatch) {
        const {player, library} = Library(dispatch);
        const command = require('command')(dispatch);

        // How long it should block C_PLAYER_LOCATION for after each S_ACTION_STAGE
        let BLOCK_MOVEMENT_FOR = 150;
        // The actual "timer"
        let blocked_until = 0;
        
        // Info regarding timer and payload of C_PLAYER_LOCATION
        let my_info = {
            timeout_triggered: true,
            timer: null,
            payload: null
        };

        function resend_payload() {
            dispatch.toServer(my_info.payload);
            my_info.timeout_triggered = true;
        }

        dispatch.hook('S_ACTION_STAGE', 4, {order: 50, filter: {fake: null}}, e=> {
            if(player.isMe(e.gameId) && player.job === 9) blocked_until = Date.now() + BLOCK_MOVEMENT_FOR;
        });

        dispatch.hook('C_PLAYER_LOCATION', 'raw', {order: 100}, (opcode, payload, incoming, fake)=> {
            clearTimeout(my_info.timer);
            let diff = blocked_until - Date.now();
            if(diff > 0) {
                // if timeout didn't trigger, send the data immediatly
                if(!my_info.timeout_triggered) resend_payload();

                // Load new information into my_info
                my_info.payload = payload;
                my_info.timeout_triggered = false;
                // Start the new timer
                my_info.timer = setTimeout(resend_payload, diff);
                return false;
            }
        });

        command.add('walk', (time) => {
            BLOCK_MOVEMENT_FOR = Number(time);
        });
    }
}

module.exports = blastFix;