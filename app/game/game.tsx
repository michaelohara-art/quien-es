'use client';

import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import Link from 'next/link';
import { UUID } from "crypto";
import clsx from 'clsx';
import { Game } from "Data/entities";
import { fetchGame, setSelection, updateHostSeen, createGame, setNextGame } from "Data/data";
import Loading from "Common/loading";

export default function GameView() {
    const [game, setGame] = useState({} as Game);
    const [selected, setSelected] = useState('' as UUID);

    // Could set up a wrapper around all these pages that does this validation once.
    const params = useSearchParams();

    const userName = params.get('name') as string;
    if (!userName)
        redirect(`/sign-in`);

    const gameId = params.get('id') as UUID;
    if (!gameId)
        redirect(`/lobby?name=${userName}`);

    const imageSetId = params.get('setId') as UUID;
    // Opponent doesn't have the image set id!
    // if (!imageSetId)
    //     redirect(`/lobby?name=${userName}`);


    useEffect(() => {
        let shouldClear = false;
        (async () => {
            const intervalId = setInterval(async () => {
                if (shouldClear) clearInterval(intervalId);

                const fetchedGame = await fetchGame(gameId);
                setGame(fetchedGame);

                // Host being seen in game is not the same as the host being online - 
                // they may be in the lobby or elsewhere, not waiting in game.
                if (fetchedGame.players.find(i => i.ishost)?.username === userName) {
                    await updateHostSeen(fetchedGame.id);
                }

            }, 3500);
        })();
        return () => { shouldClear = true; };
    }, [gameId]);

    useEffect(() => {
        (async () => {
            if (selected)
                setGame(await setSelection(game.id, selected, userName));
        })();
    }, [selected])

    function onPanelSelect(panelId: UUID) {
        if (!you.selectedpanel)
            setSelected(panelId);
    }

    function getResult() {
        const youAreCorrect = you.selectedpanel === game.panels.find(i => i.owner === opponent.username)?.id;
        const theyAreCorrect = opponent.selectedpanel === game.panels.find(i => i.owner === you.username)?.id;
        if (youAreCorrect && theyAreCorrect)
            return <div className="result-draw">Draw!</div>;
        if (youAreCorrect)
            return <div className="result-win">You win!</div>;
        if (theyAreCorrect)
            return <div className="result-loss">{opponent.username} wins!</div>;
        return <div className="result-draw">No one wins!</div>;
    }

    // TODO enable both players to start the rematch
    function newGame() {
        (async () => {
            const nextGameId = await createGame(userName, opponent.username, imageSetId);
            await setNextGame(gameId, nextGameId);
            redirect(`/game?name=${userName}&id=${nextGameId}&setId=${imageSetId}`);
        })();
    }

    if (!game.players)
        return <Loading />

    const you = game.players.find(i => i.username === userName)!;
    const opponent = game.players.find(i => i.username !== userName)!;
    const bothSelected = you.selectedpanel && opponent.selectedpanel;

    return (
        <div>
            <div>
                {game.players[0].username} VS {game.players[1].username}
                {you.ishost && ' | hosting'}
                {!bothSelected && opponent.selectedpanel && <div>opponent has selected</div>}
                {bothSelected && getResult()}
            </div>
            <div className="panel-container">
                {game.panels
                    ? game.panels.map((panel, idx) => {
                        return <div
                            key={idx}
                            className={clsx(
                                'panel',
                                {
                                    'is-mine': panel.owner === userName,
                                    'my-selection': panel.id === you.selectedpanel,
                                    'their-selection': bothSelected && panel.id === opponent.selectedpanel,
                                    'both-selection': bothSelected && panel.id === opponent.selectedpanel && panel.id === you.selectedpanel,
                                })
                            }
                            onClick={() => onPanelSelect(panel.id)}
                        >
                            <img src={panel.imgurl} />
                        </div>
                    })
                    : <Loading />
                }
            </div>
            {bothSelected && you.ishost &&
                <>
                    <button onClick={newGame}>Next Game</button>
                    <span> | </span>
                    <Link href={`/lobby?name=${userName}`} className='button'><button>Back to lobby</button></Link>
                </>
            }
            {bothSelected && !you.ishost && !game.nextgameid &&
                <div>Waiting for rematch...</div>
            }
            {bothSelected && !you.ishost && game.nextgameid &&
                <Link href={`/game?name=${userName}&id=${game.nextgameid}`}><button>Join rematch</button></Link>
            }
        </div >
    );
}