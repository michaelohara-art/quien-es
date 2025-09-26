"use server";

import postgres from 'postgres';
import { UUID } from 'crypto';
import shuffle from 'Funcs/array-shuffle';
import { User, Game, OnlineUser, Panel, GamePlayer, ImageSet, GameImage } from 'Data/entities'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function updateSchema() {
    await sql`DROP TABLE IF EXISTS Users`
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            name VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
            lastOnline TIMESTAMP NOT NULL
        );
    `;

    await sql`DROP TABLE IF EXISTS Games`
    await sql`
        CREATE TABLE IF NOT EXISTS Games (
            id UUID PRIMARY KEY,
            hostLastSeen TIMESTAMP NOT NULL,
            nextGameId UUID
        );
    `;

    await sql`DROP TABLE IF EXISTS GamePlayers`;
    await sql`
        CREATE TABLE IF NOT EXISTS GamePlayers (
            gameId UUID NOT NULL,
            userName VARCHAR(255) NOT NULL,
            isHost BOOLEAN NOT NULL,
            selectedPanel UUID
        );
    `;

    await sql`DROP TABLE IF EXISTS Panels`
    await sql`
        CREATE TABLE IF NOT EXISTS Panels (
            id UUID PRIMARY KEY,
            gameId UUID NOT NULL,
            imgUrl VARCHAR(255) NOT NULL,
            owner VARCHAR(255) NOT NULL
        );
    `;

    await sql`DROP TABLE IF EXISTS ImageSets`
    await sql`
        CREATE TABLE IF NOT EXISTS ImageSets (
            id UUID PRIMARY KEY,
            name VARCHAR(255)
        );
    `;

    await sql`DROP TABLE IF EXISTS ImageSetUsers`
    await sql`
        CREATE TABLE IF NOT EXISTS ImageSetUsers (
            username VARCHAR(255),
            setId UUID NOT NULL,
            role VARCHAR(255) NOT NULL
        );
    `;

    await sql`DROP TABLE IF EXISTS GameImages`
    await sql`
        CREATE TABLE IF NOT EXISTS GameImages (
            id VARCHAR(20) PRIMARY KEY,
            setId UUID NOT NULL,
            url VARCHAR(255) NOT NULL
        );
    `;
}

export async function signInOrUp(name: string) {
    const usersWithName = (await sql`SELECT COUNT(*) FROM Users WHERE Name = ${name}`)[0].count;
    if (usersWithName == 0)
        await sql`INSERT INTO Users (name, lastonline) VALUES (${name}, NOW())`;

    await updateLastOnline(name);
}

export async function updateLastOnline(name: string) {
    "use server";
    await sql`UPDATE Users SET LastOnline = NOW() WHERE Name = ${name}`
    return await fetchUser(name);
}

export async function fetchUser(name: string) {
    "use server";
    return (await sql<User[]>`SELECT name, lastonline FROM users WHERE name = ${name} LIMIT 1`)[0];
}

export async function fetchOnlineUsers(name: string) {
    "use server";
    // Determine a user to be 'online' if their LastOnline value
    // is within the last 5 seconds - which is the refresh rate of UserDetails.
    return (await sql<OnlineUser[]>`
        SELECT 
            u.name, 
            u.lastonline, 
            g.id as gameId, 
            CASE WHEN g.hostLastSeen > NOW() - INTERVAL '5 seconds' THEN True ELSE False END as isInGame, 
            CASE WHEN g.opponentName = ${name} AND g.hostLastSeen > NOW() - INTERVAL '5 seconds' THEN True ELSE False END AS isInvitingYou 
        FROM users u
        LEFT JOIN 
            (
                SELECT 
                    id, 
                    hostLastSeen, 
                    (SELECT userName FROM GamePlayers WHERE gameId = gInner.id AND isHost = TRUE) as hostName,
                    (SELECT userName FROM GamePlayers WHERE gameId = gInner.id AND isHost = FALSE) as opponentName
                FROM Games gInner
                -- Ignore games where the host has left
                WHERE hostLastSeen > NOW() - INTERVAL '5 seconds'
            ) g 
            on u.name = g.hostName
        -- User must be online to be displayed
        WHERE u.lastonline > NOW() - INTERVAL '5 seconds' 
        -- Do not select the logged in User
        AND name != ${name}
    `);
}

const panelCount = 4;

export async function createGame(host: string, opponent: string, imageSetId: string) {
    "use server";

    const gameId = crypto.randomUUID();
    await sql`
        INSERT INTO Games (id, hostLastSeen)
        VALUES(${gameId}, NOW());
    `;

    await sql`
        INSERT INTO GamePlayers (gameId, userName, isHost)
        VALUES (${gameId}, ${host}, TRUE)
    `;

    await sql`
        INSERT INTO GamePlayers (gameId, userName, isHost)
        VALUES (${gameId}, ${opponent}, FALSE)
    `;

    const imageSet = await fetchImageSet(imageSetId);
    const imgs = shuffle(imageSet.images.map(i => i.url));

    const panels = Array<Panel>();
    let toAssign = [host, opponent];
    for (let i = 0; i < panelCount; i++) {
        panels.push({
            id: crypto.randomUUID(),
            gameid: gameId,
            imgurl: imgs.pop(),
            // If there is anyone left in the array to assign, 
            // assign and remove them.
            // TODO could this be better designed now with GamePlayers?
            owner: toAssign.pop() || ''
        } as Panel);
    }

    // Alphabetise the panels to keep them in the same order for both players,
    // and as a means of randomising them since the IDs are UUIDs.
    panels.sort((a, b) => a.id.localeCompare(b.id));

    panels.forEach(async panel => {
        await sql`INSERT INTO Panels (id, gameId, imgUrl, owner)
        VALUES (${panel.id}, ${gameId}, ${panel.imgurl}, ${panel.owner})`;
    });

    return gameId;
}

export async function fetchGame(gameId: UUID) {
    "use server";

    const game = (await sql<Game[]>`
        SELECT id, nextGameId FROM Games WHERE id = ${gameId}
    `)[0];

    const panels = await sql<Panel[]>`
        SELECT * FROM Panels WHERE gameId = ${gameId}
    `;

    const players = await sql<GamePlayer[]>`
        SELECT * FROM GamePlayers WHERE gameId = ${gameId}
    `;

    game.panels = panels;
    game.players = players;
    return game;
}

export async function updateHostSeen(id: UUID) {
    await sql`UPDATE Games SET hostLastSeen = NOW() WHERE id = ${id}`;
}

export async function setSelection(gameId: UUID, panelId: UUID, userName: string) {
    "use server";

    await sql`
        UPDATE GamePlayers 
        SET selectedPanel = ${panelId} 
        WHERE gameId = ${gameId} AND userName = ${userName}
    `

    return await fetchGame(gameId);
}

export async function setNextGame(id: UUID, nextGameId: string) {
    await sql`UPDATE Games SET nextGameId = ${nextGameId} WHERE id = ${id}`;
}

export async function createImageSet(userName: string, setName: string) {
    const id = crypto.randomUUID();
    await sql`INSERT INTO ImageSets (id, name) VALUES (${id}, ${setName})`;
    await sql`INSERT INTO ImageSetUsers (userName, setId, role) VALUES (${userName}, ${id}, 'OWNER')`;
}

export async function fetchMyImageSets(userName: string) {
    return await sql <ImageSet[]>`
        SELECT id, name FROM ImageSets 
        WHERE id IN (SELECT setId FROM ImageSetUsers WHERE username = ${userName})
    `;
}

export async function fetchImageSet(setId: string) {
    const set = (await sql<ImageSet[]>`SELECT * FROM ImageSets WHERE id = ${setId}`)[0];

    set.images = await sql<GameImage[]>`
        SELECT * FROM GameImages WHERE setId = ${set.id}
    `;

    return set;
}

// TODO standardise on passing UUID or string! probably UUID
export async function saveImage(id: string, setId: string, url: string) {
    await sql`
        INSERT INTO GameImages (id, setId, url)
        VALUES (${id},${setId},${url})
    `;
}