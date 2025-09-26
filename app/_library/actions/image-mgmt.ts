"use server";

// use for retrieval??
import { v2 as cloudinary } from 'cloudinary';

const config = {
    cloud_name: 'dllykhyrw'
};

cloudinary.config(config);

const url = `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`;
// https://console.cloudinary.com/app/c-63d1497af27e3909178da7fce90d55/settings/upload/presets
const uploadPreset = 'shimb_basic';

export default async function uploadImages(image: File) {
    // TODO how to shrink and crop imgs before upload
    const formData = new FormData();
    formData.append('upload_preset', uploadPreset);
    formData.append('file', image);

    return await fetch(url, {
        method: 'POST',
        body: formData,
    }).then((response) => {
        return response.text();
    }).then((data) => {
        return JSON.parse(data);
    });
}
