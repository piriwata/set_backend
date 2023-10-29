import { Server } from "socket.io";

const a_color = ["R", "G", "B"];
const a_form = ["C", "S", "D"];
const a_filled = ["N", "B", "F"];
const a_num = ["1", "2", "3"];
const a_card_set_org = [];
const a_client_cards = [];
let a_card_deck = [];

const c_card_num_on_field = 12;
const c_time_out_ms = 60000;
let setTimeout_id = null;

let total_score = 0;
const a_score_que = [];
const o_score = {};
const c_score_max = 27;

const get_card = () => {

    const get_card_idx = Math.floor(Math.random()*(a_card_deck.length));
    const get_card_info = a_card_deck[get_card_idx];

    // Draw a card from the deck
    a_card_deck.splice(get_card_idx, 1);

    return get_card_info;
}

const change_all_client_cards = (io) => {

    console.log("Delayed for 3 miniutes.");

    if (a_card_deck.length < 12)
    {
        // cards is less than 1
        a_card_deck = a_card_set_org.slice();
    }

    for (let i = 0; i < c_card_num_on_field; i ++)
    {
        a_client_cards.splice(i, 1, get_card());
    }

    io.emit("new_cards_set", a_client_cards);
    setTimeout_id = setTimeout(() => {
        change_all_client_cards(io);
    }, c_time_out_ms);
}

const cal_score = (socket_id) => {
    
    o_score[socket_id] = (o_score[socket_id] === undefined) ? (1) : (o_score[socket_id] + 1);
    a_score_que.push(socket_id);

    if (total_score < c_score_max)
    {
        total_score += 1;

    } else {
        // delete score
        const delete_score_id = a_score_que.shift();
        o_score[delete_score_id] -= 1;
        if (o_score[delete_score_id] <= 0)
        {
            delete o_score[delete_score_id];
        }
    }
}

/* Initialization of set card -> */
a_color.forEach(co => {
    a_form.forEach(fo => {
        a_filled.forEach(fi => {
            a_num.forEach(nu => {
                a_card_set_org.push(co + fo + fi + nu);
            })
        })
    })
})

a_card_deck = a_card_set_org.slice();

for (let i = 0; i < c_card_num_on_field; i ++)
{
    a_client_cards.push(get_card());
}

/* <- Initialization of set card */


/* Start of the game -> */

const io = new Server(3000, {
    cors: true,
});

console.log("Server started.");

io.on("connection", (socket) => {
    console.log("Client has connected!");

    socket.emit("new_cards_set", a_client_cards);
    if (setTimeout_id === null)
    {
        setTimeout_id = setTimeout(() => {
            change_all_client_cards(io);
        }, c_time_out_ms);
    }

    socket.on("reply", (ans) => {
        // reset timer
        clearTimeout(setTimeout_id);
        setTimeout_id = setTimeout(() => {
            change_all_client_cards(io);
        }, c_time_out_ms);

        const correct_answer = [0, 1, 2, 3]
            .map((kind) => new Set([0, 1, 2].map(idx => a_client_cards[ans[idx]][kind])))
            .every(set => set.size !== 2);

        if (correct_answer)
        {
            socket.emit("your_answer_is_correct");
            cal_score(socket.id);

            if (a_client_cards.length > c_card_num_on_field)
            {
                // cards is more than 12
                ans.sort().reverse().forEach(idx => a_client_cards.splice(idx, 1));
            } else {

                if (a_card_deck.length <= 0)
                {
                    // cards is less than 1
                    a_card_deck = a_card_set_org.slice();

                    for (let i = 0; i < c_card_num_on_field; i ++)
                    {
                        a_client_cards.splice(i, 1, get_card());
                    }

                } else {
                    // Discard the cards that was used for the answer
                    ans.forEach(idx => a_client_cards.splice(idx, 1, get_card()));
                }    
            }

            io.emit("new_cards_set", a_client_cards, o_score);
            console.log(o_score);
        } else {
            socket.emit("your_answer_is_not_correct");
        }
    });
});

/* <- Start of the game */