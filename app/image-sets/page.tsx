"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import FilePicker from "Common/filepicker";
import { ImageSet } from "Data/entities";
import { createImageSet, fetchImageSet, fetchMyImageSets } from "Data/data";

export default function ImageSets() {
    const [nameInput, setNameInput] = useState('');
    // ugh lol
    const [selectedSet, setSelectedSet] = useState({} as ImageSet);
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

    function onSetSelected(e: ChangeEvent<HTMLSelectElement>) {
        e.preventDefault();
        console.log();
        const setId = e.target.value;
        (async () => {
            setSelectedSet(await fetchImageSet(setId));
        })();
    }

    function addImageSet(e: FormEvent) {
        e.preventDefault();
        (async (e) => {
            await createImageSet(userName, nameInput);
            setImageSets(await fetchMyImageSets(userName));
            setNameInput('');
        })();
    }

    return (
        <>
            {selectedSet.images?.map((i, idx) => {
                // TODO delete images
                return <img key={idx} src={i.url} width="80" height="80" />
            })}
            <FilePicker selectedSet={selectedSet} />
            <select onChange={(e) => onSetSelected(e)} defaultValue="">
                <option value="" disabled>Choose an Image Set to manage</option>
                {imageSets.map((set, idx) =>
                    <option key={idx} value={set.id}>{set.name}</option>
                )}
            </select>
            <form onSubmit={addImageSet}>
                <input onChange={(e) => setNameInput(e.target.value)} id="setName" value={nameInput} />
                <button>Create Set</button>
            </form>
        </>
    );
}