'use client';
import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import Link from 'next/link';
import { updateLastOnline } from "Data/data";
import { User } from "Data/entities";
import Loading from "Common/loading";

export default function UserDetails() {
    const params = useSearchParams();
    const userName = params.get('name') as string;
    if (!userName)
        redirect('/sign-in');

    const [user, setUser] = useState({} as User);

    useEffect(() => {
        let shouldClear = false;
        (async () => {
            const intervalId = setInterval(async () => {
                if (shouldClear) clearInterval(intervalId);

                setUser(await updateLastOnline(userName));

            }, 3500);
        })();
        return () => { shouldClear = true; };
    }, []);

    if (!user.name)
        return <Loading />

    return <div>
        <div>
            <Link href={`/lobby?name=${userName}`}>LOBBY</Link>
            <span> | </span>
            <Link href={`/image-sets?name=${userName}`}>IMAGES</Link>
        </div>
        <div>hello {user.name}</div>
    </div>
}