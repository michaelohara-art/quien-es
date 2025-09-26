import { UUID } from "crypto";

// Database objects

export type User = {
    name: string,
    lastonline: Date
}

export type Game = {
    id: UUID,
    nextgameid: UUID,
    panels: Array<Panel>,
    players: Array<GamePlayer>
}

export type GamePlayer = {
    username: string,
    ishost: boolean,
    selectedpanel: UUID
}

export type Panel = {
    id: UUID,
    gameid: UUID,
    imgurl: string,
    owner: string
}

export type ImageSet = {
    id: UUID,
    name: string,
    users: Array<ImageSetUsers>,
    images: Array<GameImage>
}

export type GameImage = {
    // the id in cloudinary
    id: string,
    url: string
}

export type ImageSetUsers = {
    username: string,
    setid: UUID,
    role: string // can make enum?
}

// Derived objects

export type OnlineUser = {
    name: string,
    lastonline: Date,
    gameid: UUID,
    isingame: boolean,
    isinvitingyou: boolean
}
