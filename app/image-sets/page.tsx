"use client";

import { Suspense } from "react";
import Loading from 'Common/loading';
import ImageSetsContent from "./content-ugh";

export default function ImageSets() {
    return <Suspense fallback={<Loading />}>
        <ImageSetsContent />
    </Suspense>
}