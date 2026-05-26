# Proximity Voice Chat
A Module for Foundry VTT that transforms Foundry's built-in voice chat into a proximity voice chat.

You can watch [a showcase of the module's features](https://www.youtube.com/watch?v=jV3ZPuTRQKw) on youtube.

This module is designed so that a gamemaster only has to add players' UUIDs to the userlist of the relevant tokens. Then it'll automatically do volume calculations based the location of the user's controlled tokens to other users' proximity tokens using the same volume system as Foundry's placeable Ambient Sounds.

## Features
Automatic user volume adjustments depending on the distance between your controlled tokens and the other user's proximity tokens, respecting walls.

<small>The following only appear for gamemasters (`game.user.isGM`).</small>

Buttons to toggle global listening and global speaking (ignore proximity) that can be found alongside foundry's voicechat buttons.

A toggle button in the token HUD to quickly add/remove yourself to/from that token's userlist.

## Settings
Token settings to define what users are speaking through that token and optionally a token-specific proximity radius & radius type, these can also be changed for an actor's prototype token.

Scene settings to define a scene-specific default proximity radius & radius type, and a toggle to disable proximity for that scene.

Game settings to define the default proximity radius & radius type, and toggle global speaking for yourself.

## API
A number of helper functions and enums are available for modules to interact with the proximity system and can be accessed at `game.modules.get("proximity-voice-chat").api`.

### Interacting with a token's userlist
* `get_userlist(token: foundry.documents.TokenDocument): string | undefined`
* `set_userlist(token: foundry.documents.TokenDocument, userlist: string): Promise<any>`
* `is_user_in_userlist(token: foundry.documents.TokenDocument, user_uuid: string): boolean`
* `add_user_to_userlist(token: foundry.documents.TokenDocument, user_uuid: string): Promise<any>`
* `remove_user_from_userlist(token: foundry.documents.TokenDocument, user_uuid: string): void | Promise<any>`

### Proximity radius type definitions
* `RADIUS_TYPE.PIXELS: number`
* `RADIUS_TYPE.TILES: number`

### Getting and setting proximity radius
* `get_calculated_token_radius(token: foundry.documents.TokenDocument): number`
* `get_calculated_token_radius_type(token: foundry.documents.TokenDocument): RADIUS_TYPE`
* `get_token_radius(token: foundry.documents.TokenDocument): number | undefined`
* `get_token_radius_type(token: foundry.documents.TokenDocument): RADIUS_TYPE`
* `set_token_radius(token: foundry.documents.TokenDocument, radius: number | null): Promise<any>`
* `set_token_radius_type(token: foundry.documents.TokenDocument, radius_type: RADIUS_TYPE): Promise<any>`
* `get_scene_radius(scene: foundry.documents.Scene): number | undefined`
* `get_scene_radius_type(scene: foundry.documents.Scene): RADIUS_TYPE`
* `set_scene_radius(scene: foundry.documents.Scene, radius: number | null): Promise<any>`
* `set_scene_radius_type(scene: foundry.documents.Scene, radius_type: RADIUS_TYPE): Promise<any>`

### Getting and setting a scene's proximity disabled/enabled status
* `is_scene_disabled(scene: foundry.documents.Scene): boolean`
* `set_scene_disabled(scene: foundry.documents.Scene, disabled: boolean): Promise<any>`