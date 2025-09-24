import { UUID } from "crypto";

export type User = {
    name: string,
    lastonline: Date
}

export type Game = {
    id: UUID,
    host: string,
    opponent: string,
    hostlastseen: Date,
    panels: Array<Panel>
}

export type OnlineUser = {
    name: string,
    lastonline: Date,
    gameid: UUID,
    isingame: boolean,
    isinvitingyou: boolean
}

export type Panel = {
    id: UUID,
    imgUrl: string,
    owner: string
}
