'use client';

import { UUID } from "crypto";
import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { createGame, fetchOnlineUsers, } from "Data/data";
import { ImageSet, OnlineUser } from "Data/entities";
import Loading from "Common/loading";

export default function OnlineUsers({ imageSet }: { imageSet: ImageSet }) {
    const params = useSearchParams();
    const userName = params.get('name') as string;
    if (!userName)
        redirect('/sign-in');

    const [onlineUsers, setOnlineUsers] = useState(new Array<OnlineUser>());

    useEffect(() => {
        let shouldClear = false;
        (async () => {
            const intervalId = setInterval(async () => {
                if (shouldClear) clearInterval(intervalId);

                let fetchedUsers = await fetchOnlineUsers(userName);
                fetchedUsers.sort((a, b) => a.name.localeCompare(b.name));
                setOnlineUsers(fetchedUsers);

            }, 3500);
        })();
        return () => { shouldClear = true; };
    }, []);

    function startGame(onlineUserName: string) {
        (async () => {
            const gameId = await createGame(userName, onlineUserName, imageSet.id);
            // TODO at this point we add global state management right?
            redirect(`/game?name=${userName}&id=${gameId}&setId=${imageSet.id}`);
        })();
    }

    function joinGame(gameId: UUID) {
        redirect(`/game?name=${userName}&id=${gameId}`);
    }

    function getOnlineUserAction(onlineUser: OnlineUser) {
        if (onlineUser.isinvitingyou)
            return <button onClick={() => joinGame(onlineUser.gameid)}>Accept Invite</button>;
        else if (!onlineUser.isingame)
            return <button onClick={() => startGame(onlineUser.name)}>Start Game</button>;
        else return <span>in game</span>;
    }

    if (onlineUsers.length === 0)
        return <Loading />

    return <div>
        {onlineUsers.map((onlineUser, idx) => {
            return <div key={idx}>
                <div>
                    <span>{onlineUser.name}</span>
                    <span> | </span>
                    {getOnlineUserAction(onlineUser)}
                </div>
            </div>
        })}
    </div>
}
