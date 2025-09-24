"use server";

import postgres from 'postgres';
import { User, Game, OnlineUser, Panel } from 'Data/entities'
import { UUID } from 'crypto';

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
            host VARCHAR(255) NOT NULL,
            opponent VARCHAR(255) NOT NULL
        );
    `;

    await sql`DROP TABLE IF EXISTS Panels`
    await sql`
        CREATE TABLE IF NOT EXISTS Panels (
            id UUID PRIMARY KEY,
            imgUrl VARCHAR(255) NOT NULL,
            owner VARCHAR(255) NOT NULL
        );
    `;

    await sql`DROP TABLE IF EXISTS GamePanels`
    await sql`
        CREATE TABLE IF NOT EXISTS GamePanels (
            id INT GENERATED ALWAYS AS IDENTITY,
            gameId UUID NOT NULL,
            panelId UUID NOT NULL
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
            CASE WHEN g.opponent = ${name} AND g.hostLastSeen > NOW() - INTERVAL '5 seconds' THEN True ELSE False END AS isInvitingYou 
        FROM users u
        LEFT JOIN 
            -- Ignore games where the host has left
            (SELECT * FROM Games WHERE hostLastSeen > NOW() - INTERVAL '5 seconds') g 
            on u.name = g.host
        -- User must be online to be displayed
        WHERE u.lastonline > NOW() - INTERVAL '5 seconds' 
        -- Do not select the logged in User
        AND name != ${name}
    `);
}

const panelCount = 4;

export async function createGame(host: string, opponent: string) {
    "use server";

    const panels = Array<Panel>();
    let toAssign = [host, opponent];
    for (let i = 0; i < panelCount; i++) {
        panels.push({
            id: crypto.randomUUID(),
            // TODO get images
            imgUrl: `img-${i}`,
            // If there is anyone left in the array to assign, 
            // assign and remove them.
            owner: toAssign.pop() || ''
        } as Panel);
    }

    // Alphabetise the panels to keep them in the same order for both players,
    // and as a means of randomising them.
    panels.sort((a, b) => a.id.localeCompare(b.id));

    const gameId = crypto.randomUUID();
    await sql`INSERT INTO Games
        (id, host, opponent, hostLastSeen)
        VALUES(${gameId}, ${host}, ${opponent}, NOW());
    `;

    panels.forEach(async panel => {
        await sql`INSERT INTO Panels (id, imgUrl, owner)
        VALUES (${panel.id}, ${panel.imgUrl}, ${panel.owner})`;

        await sql`INSERT INTO GamePanels (gameId, panelId)
        VALUES (${gameId}, ${panel.id})`;
    });

    return gameId;
}

export async function fetchGame(gameId: UUID) {
    "use server";
    const game = (await sql<Game[]>`
        SELECT * FROM Games WHERE id = ${gameId}
    `)[0];

    const panels = (await sql<Panel[]>`
        SELECT * FROM Panels WHERE id IN 
        (SELECT panelId from GamePanels WHERE gameId = ${gameId})
    `);

    game.panels = panels;
    return game;
}

export async function updateHostSeen(id: UUID) {
    await sql`UPDATE Games SET hostLastSeen = NOW() WHERE id = ${id}`;
}