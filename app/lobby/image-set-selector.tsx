"use client";

import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { ImageSet } from "Data/entities";
import { fetchMyImageSets } from "Data/data";

// This is a trim version of the image-sets page - can reuse?
export default function ImageSetSelector({ onSelected }: { onSelected: (setId: string) => void }) {
    const [imageSets, setImageSets] = useState(Array<ImageSet>());

    const params = useSearchParams();
    const userName = params.get('name') as string;
    if (!userName)
        redirect('/sign-in');

    useEffect(() => {
        (async () => {
            setImageSets(await fetchMyImageSets(userName));
        })();
    }, []);

    return (
        <select onChange={(e) => onSelected(e.target.value)} defaultValue="">
            <option value="" disabled>Choose an Image Set to play</option>
            {imageSets.map((set, idx) =>
                <option key={idx} value={set.id}>{set.name}</option>
            )}
        </select>
    );
}