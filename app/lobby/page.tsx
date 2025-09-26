"use client";

import { useState } from 'react';
import { fetchImageSet } from 'Data/data';
import { ImageSet } from 'Data/entities';
import UserDetails from 'Common/user-details';
import OnlineUsers from './online-users';
import ImageSetSelector from './image-set-selector';

export default function Lobby() {
  const [selectedSet, setSelectedSet] = useState({} as ImageSet);

  function onSetSelected(setId: string) {
    (async () => {
      // TODO This only needs the ID, but it gets the whole thing with URLs too
      setSelectedSet(await fetchImageSet(setId));
    })();
  }

  return (
    <div className="container">
      <UserDetails />
      <ImageSetSelector onSelected={onSetSelected} />
      <OnlineUsers imageSet={selectedSet} />
    </div>
  );
}
