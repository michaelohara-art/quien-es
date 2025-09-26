"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import uploadImage from 'Actions/image-mgmt';
import { ImageSet } from 'Data/entities';
import { saveImage } from '../data/data';

export default function FilePicker({ selectedSet }: { selectedSet: ImageSet }) {
    const { handleSubmit, reset, register } = useForm();
    const [images, setImages] = useState(Array<File>());

    function clear() {
        setImages(Array<File>());
        reset();
    }

    function upload() {
        (async () => images.forEach(async i => {
            // TODO network req size max is 4mb - validate?
            const result = await uploadImage(i);
            await saveImage(result.public_id, selectedSet.id, result.url);
        }))();
    }

    return (
        <form onSubmit={handleSubmit((data) => {
            const imgArray: File[] = Array.from(data.images);
            setImages(imgArray);
            reset();
        })}>
            <div className='flex'>
                {images?.map((i, idx) => {
                    const url = URL.createObjectURL(i);
                    const sizeKb = Math.round((i.size / 1024));
                    return <img key={idx} src={url} width="80" height="80" alt={`${sizeKb}kb`} />
                })}
            </div>
            <input {...register('images')} type="file" multiple={true} />
            <div>
                <button type='submit'>Open</button>
                <span> | </span>
                <button type='button' onClick={clear}>Clear</button>
                <span> | </span>
                <button type='button' onClick={upload} disabled={images.length === 0}>Upload</button>
            </div>
        </form>
    );
} 