export const MODULE_ID = "proximity-voice-chat";

/**
 * Gets a token's userlist
 * @param {foundry.documents.TokenDocument} token the token whose userlist will be retrieved
 * @returns {string | undefined} the token's userlist, which is string representing a comma separated list of user UUIDs, or undefined if the token doesn't have a userlist
 */
export function get_userlist(token) {
  return token.getFlag(MODULE_ID, "userlist");
}

/**
 * Sets a token's userlist
 * @param {foundry.documents.TokenDocument} token the token whose userlist will be overwritten
 * @param {string} userlist the new userlist
 * @returns {Promise} the result of foundry.documents.TokenDocument#setFlag
 */
export function set_userlist(token, userlist) {
  return token.setFlag(MODULE_ID, "userlist", userlist);
}

/**
 * Checks if a user is in a token's userlist
 * @param {foundry.documents.TokenDocument} token the token whose userlist will be checked
 * @param {string} user_uuid the UUID of the user to check for
 * @returns {boolean} whether the user is in the token's userlist or not
 */
export function is_user_in_userlist(token, user_uuid) {
  let userlist = token.getFlag(MODULE_ID, "userlist");
  if (!userlist) return false;
  const comma_splitter = /\s*,\s*/;
  let userlist_array = userlist.split(comma_splitter);
  return userlist_array.includes(user_uuid);
}

/**
 * Adds a user to a token's userlist
 * @param {foundry.documents.TokenDocument} token the token for which the user will be added as a speaker
 * @param {string} user_uuid the UUID of the user to add to the token's userlist
 * @returns {Promise} the result of foundry.documents.TokenDocument#setFlag
 */
export function add_user_to_userlist(token, user_uuid) {
  let userlist = token.getFlag(MODULE_ID, "userlist");
  if (!userlist) {
    return token.setFlag(MODULE_ID, "userlist", user_uuid);
  }
  const comma_splitter = /\s*,\s*/;
  let userlist_array = userlist.split(comma_splitter);
  if (!userlist_array.includes(user_uuid)) {
    userlist_array.push(user_uuid);
  }
  return token.setFlag(MODULE_ID, "userlist", userlist_array.join(","));
}

/**
 * Removes a user from a token's userlist
 * @param {foundry.documents.TokenDocument} token the token for which the user will be removed from being a speaker
 * @param {string} user_uuid the UUID of the user to remove from the token's userlist
 * @returns {Promise | void} the result of foundry.documents.TokenDocument#setFlag if the token had a userlist, otherwise nothing
 */
export function remove_user_from_userlist(token, user_uuid) {
  let userlist = token.getFlag(MODULE_ID, "userlist");
  if (!userlist) return;
  const comma_splitter = /\s*,\s*/;
  let userlist_array = userlist.split(comma_splitter).filter(uuid => uuid !== user_uuid).join(",");
  return token.setFlag(MODULE_ID, "userlist", userlist_array);
}

/**
 * Gets a token's calculated proximity radius, which is either the token's radius, the scene's radius, or the game setting default radius, in that order of precedence
 * @param {foundry.documents.TokenDocument} token the token for who its proximity radius will be calculated
 * @returns {number} the token's proximity radius in pixels
 */
export function get_calculated_token_radius(token) {
  return token.getFlag(MODULE_ID, "radius") ?? token.parent.getFlag(MODULE_ID, "radius") ?? game.settings.get(MODULE_ID, "defaultProximityRadius");
}

/**
 * Gets a token's proximity radius if it has one
 * @param {foundry.documents.TokenDocument} token the token whose proximity radius will be retrieved
 * @returns {number | undefined} the token's proximity radius in pixels, or undefined if the token doesn't have a specified proximity radius
 */
export function get_token_radius(token) {
  return token.getFlag(MODULE_ID, "radius");
}

/**
 * Sets a token's proximity radius
 * @param {foundry.documents.TokenDocument} token the token whose proximity radius will be overwritten
 * @param {number | null} radius the new proximity radius, set to null to unset the token's radius and use the scene's default radius instead
 * @returns {Promise} the result of foundry.documents.TokenDocument#setFlag
 */
export function set_token_radius(token, radius) {
  return token.setFlag(MODULE_ID, "radius", radius);
}

/**
 * Gets a scene's default proximity radius if it has one
 * @param {foundry.documents.Scene} scene the scene whose proximity radius will be retrieved
 * @returns {number | undefined} the scene's proximity radius in pixels, or undefined if the scene doesn't have a specified proximity radius
 */
export function get_scene_radius(scene) {
  return scene.getFlag(MODULE_ID, "radius");
}

/**
 * Sets a scene's default proximity radius
 * @param {foundry.documents.Scene} scene the scene whose proximity radius will be overwritten
 * @param {number | null} radius the new proximity radius, set to null to unset the scene's radius and use the module's default radius instead (which can be changed in the module settings)
 * @returns {Promise} the result of foundry.documents.Scene#setFlag
 */
export function set_scene_radius(scene, radius) {
  return scene.setFlag(MODULE_ID, "radius", radius);
}

/**
 * Checks if proximity voice chat is disabled for a scene
 * @param {foundry.documents.Scene} scene the scene to check for whether proximity voice chat is disabled or not
 * @returns {boolean} whether proximity voice chat is disabled for the scene or not
 */
export function is_scene_disabled(scene) {
  return scene.getFlag(MODULE_ID, "disabled") ?? false;
}

/**
 * Sets a scene's disabled status for proximity voice chat
 * @param {foundry.documents.Scene} scene the scene for which proximity voice chat will be enabled/disabled
 * @param {boolean} disabled whether to disable (true) or enable (false) proximity voice chat
 * @returns {Promise} the result of foundry.documents.Scene#setFlag
 */
export function set_scene_disabled(scene, disabled) {
  return scene.setFlag(MODULE_ID, "disabled", disabled);
}

function _setup_sheet_tab(sheet_config, template_name) {
  sheet_config.TABS.sheet.tabs.push({ id: "proximity", icon: "fa-solid fa-podcast" });
  sheet_config.PARTS.proximity = { scrollable: [''], template: "modules/" + MODULE_ID + "/templates/" + template_name };

  /* changes order of the proximity tab to be before the footer in the DOM
    since object order is guaranteed as of es6 and works on insertion order
    and which is also what defines the order in which the html elements appear in
    this feels like it's the wrong way to go about it but I couldn't find a different way to change PARTS*/

  let keys = Object.keys(sheet_config.PARTS);
  // extracts the proximity key and re-inserts it before the footer key
  keys.splice(keys.indexOf("footer"), 0, keys.splice(keys.indexOf("proximity"), 1)[0]);// could technically just remove the last element instead of indexof("proximity") but this feels more explicit
  // turns the array of keys back into an object but without values so Object.assign can apply the values of the original PARTS while keeping the order of the newly created object
  let order_template = keys.reduce((a, v) => ({ ...a, [v]: undefined }), {});
  sheet_config.PARTS = Object.assign(order_template, sheet_config.PARTS);
  // all this is just because I couldn't think of a way to let Object.keys(...).sort() to sort it the way I wanted without affecting the rest of the order
}

Hooks.on("init", async () => {
  _setup_sheet_tab(foundry.applications.sheets.TokenConfig, "token-proximity-tab.hbs");
  _setup_sheet_tab(foundry.applications.sheets.PrototypeTokenConfig, "token-proximity-tab.hbs");
  _setup_sheet_tab(foundry.applications.sheets.SceneConfig, "scene-proximity-tab.hbs");
  await game.settings.register(MODULE_ID, "defaultProximityRadius", {
    name: "proximity-voice-chat.Settings.DefaultProximityRadius.Label",
    hint: "proximity-voice-chat.Settings.DefaultProximityRadius.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 1200,// 12 tiles at 100px grid size / 60ft at 5ft tile size
    onChange: () => {
      _refresh_all_tokens();
      _update_volumes();
    }
  });
  await game.settings.register(MODULE_ID, "globalListen", {
    name: "proximity-voice-chat.Settings.globalListen.Label",
    hint: "proximity-voice-chat.Settings.globalListen.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      _update_volumes();
    }
  });
  // exposed api for macros
  game.modules.get(MODULE_ID).api = {
    get_userlist,
    set_userlist,
    is_user_in_userlist,
    add_user_to_userlist,
    remove_user_from_userlist,
    get_calculated_token_radius,
    get_token_radius,
    set_token_radius,
    get_scene_radius,
    set_scene_radius,
    is_scene_disabled,
    set_scene_disabled
  }
});


/**
 * @type {Map<String, {soundsource: foundry.canvas.sources.PointSoundSource, userlist: Array<String>}>}
 */
let _token_proximity_data = new Map();

/**
 * Updates or creates a token's proximity data, arguments are optional if there's no change in the actual data but the PointSoundSource just needs to be reinitialized.
 * @param {foundry.documents.TokenDocument} token the token whose proximity data is being updated
 * @param {String} userlist the comma separated list of user UUIDs that speak through this token
 * @param {Partial<BaseEffectSourceData>} data data passed to PointSoundSource.initialize to recalculate the soundsource
 */
function _update_proximity_data(token, userlist = "", data = {}) {
  const default_radius = canvas.scene.getFlag(MODULE_ID, "radius") ?? game.settings.get(MODULE_ID, "defaultProximityRadius");
  if (data.radius === null) data.radius = default_radius;
  const comma_splitter = /\s*,\s*/;// splits on commas with any amount of whitespace on both sides
  let proximity_data = _token_proximity_data.get(token.uuid);
  if (proximity_data === undefined) {
    // get can only be undefined if the proximity_data hasn't been created yet
    if (typeof userlist !== "string" || userlist === "") return;
    _token_proximity_data.set(token.uuid, {
      soundsource: new foundry.canvas.sources.PointSoundSource({ object: token }),
      userlist: userlist.split(comma_splitter)
    });
    proximity_data = _token_proximity_data.get(token.uuid);

    const midpoint = token.getCenterPoint({ x: 0, y: 0, elevation: 0 });
    // default initialize data while respecting any data passed
    data = Object.assign({
      x: token.x + (midpoint.x ?? 0),
      y: token.y + (midpoint.y ?? 0),
      elevation: token.elevation + (midpoint.elevation ?? 0),
      radius: default_radius,
      walls: true,
      disabled: false
    }, data);
  } else if (typeof userlist === "string" && userlist !== "") {
    // proximity data exists but userlist has to be updated
    proximity_data.userlist = userlist.split(comma_splitter);
  }

  proximity_data.soundsource.initialize(data);
}

function _delete_proximity_data(token) {
  _token_proximity_data.delete(token.uuid);
}

function _is_voice_active() {
  const mode = game.settings.get("core", "rtcWorldSettings")?.mode;
  return mode !== undefined && (mode === foundry.av.AVSettings.AV_MODES.AUDIO || mode === foundry.av.AVSettings.AV_MODES.AUDIO_VIDEO);
}

function _update_volumes() {
  if (!_canvas_ready) return;// idk why this happens, maybe loading onto a scene where other players are already causing volume updates?
  if (!_is_voice_active()) return;// should be unnecessary (why would you run this module without voice?) but just in case
  /**
   * @type {Map<string, number>}
   */
  let user_volumes = new Map();
  if (!canvas?.scene?.getFlag(MODULE_ID, "disabled") && !game.settings.get(MODULE_ID, "globalListen")) {
    let proximity_tokens = Array.from(_token_proximity_data.values());
    let controlled = canvas.tokens.controlled;
    if (controlled.length === 0) {
      controlled = canvas.tokens.ownedTokens;
    }
    game.users.filter((user) => user.active && game.user.uuid !== user.uuid).forEach((other_active_user) => {
      let volume = 0;
      if (other_active_user.getFlag(MODULE_ID, "global_speaker")) {
        volume = 1;
      } else {
        proximity_tokens.forEach((proximity_token) => {
          if (volume >= 1) return;
          if (!proximity_token.userlist.includes(other_active_user.uuid)) return;
          controlled.forEach((controlled_token) => {
            if (volume >= 1) return;
            const midpoint = controlled_token.getCenterPoint({ x: 0, y: 0, elevation: 0 });
            let listen_location = {
              x: controlled_token.x + (midpoint.x ?? 0),
              y: controlled_token.y + (midpoint.y ?? 0),
              elevation: controlled_token.document.elevation + (midpoint.elevation ?? 0)
            };
            let token_volume = proximity_token.soundsource.getVolumeMultiplier(listen_location, { easing: true });
            volume = Math.max(volume, token_volume);
          });

        });
      }
      user_volumes.set(other_active_user.id, volume);
    });
  } else {
    game.users.filter((user) => user.active && game.user.uuid !== user.uuid).forEach((other_active_user) => {
      user_volumes.set(other_active_user.id, 1);
    });
  }

  user_volumes.forEach((volume, user_id) => {
    // apply the volume multiplier in user space (0.8 = 80% as loud) rather than the strange decibel? logarithmic? or something idk space that video.volume uses
    volume = foundry.audio.AudioHelper.inputToVolume(foundry.audio.AudioHelper.volumeToInput(game.webrtc.settings.get("client", "users." + user_id + ".volume") ?? 1) * volume);
    let audio_source = ui.webrtc.getUserVideoElement(user_id);
    if (game.modules.get("avclient-livekit")?.active) {
      // should allow avclient-livekit to work, but might not account for every case of that module changing audio volume
      // but that module doesn't seem to have an api of any kind so if it has issues: eh I tried
      audio_source = audio_source?.parentElement?.querySelector(".user-microphone-audio") ?? audio_source;
    }
    if (audio_source) audio_source.volume = volume;
  });
}

function _refresh_all_tokens() {
  canvas.scene.tokens.values().filter((token) => {
    const userlist = token.getFlag(MODULE_ID, "userlist");
    return userlist !== undefined && typeof userlist === "string" && userlist !== "";
  }).forEach(token => {
    let radius = token.getFlag(MODULE_ID, "radius");
    if (radius === undefined) radius = null;
    _update_proximity_data(token, undefined, { radius: radius });
  });
}

Hooks.on("updateToken", (document, changed, _options, _userId) => {
  const userlist = changed.flags?.[MODULE_ID]?.userlist;
  const radius = changed.flags?.[MODULE_ID]?.radius;
  if (userlist !== undefined || radius !== undefined) {
    Hooks.callAll("updateTokenProximitySettings", document, userlist, radius);
  }
});

// don't remember why I made this its own hook
Hooks.on("updateTokenProximitySettings", async (token, userlist, radius) => {
  let data = {};
  if (radius !== undefined) data.radius = radius;
  if (userlist === "" || userlist === null) {
    _delete_proximity_data(token);
  } else {
    _update_proximity_data(token, userlist, data);
  }

  _update_volumes();
});

Hooks.on("updateScene", (_document, changed, _options, _userId) => {
  const radius = changed.flags?.[MODULE_ID]?.radius;
  const disabled = changed.flags?.[MODULE_ID]?.disabled;
  if (radius !== undefined) {
    _refresh_all_tokens();
    _update_volumes();
  } else if (disabled !== undefined) {
    _update_volumes();
  }
});

Hooks.on("updateUser", (_document, changed, _options, _userId) => {
  if (changed.flags?.[MODULE_ID]?.global_speaker !== undefined) {
    setTimeout(() => {
      _update_volumes();
    }, 100);
  }
});

Hooks.on("canvasTearDown", (_canvas) => {
  _token_proximity_data.clear();

  _canvas_ready = false;
});

let _canvas_ready = false;
Hooks.on("canvasReady", (canvas) => {
  _canvas_ready = true;
  canvas.scene.tokens.values().filter((token) => {
    const userlist = token.getFlag(MODULE_ID, "userlist");
    return userlist !== undefined && typeof userlist === "string" && userlist !== "";
  }).forEach(token => {
    let radius = token.getFlag(MODULE_ID, "radius");
    if (radius === undefined) radius = null;
    _update_proximity_data(token, token.getFlag(MODULE_ID, "userlist"), { radius: radius });
  });
  // fix volume not updating between scene changes because of hook order stuff
  setTimeout(() => {
    _update_volumes();
  }, 100);
});

Hooks.on("createToken", (document, _options, _userId) => {
  if (!document.getFlag(MODULE_ID, "userlist")) return;
  let radius = document.getFlag(MODULE_ID, "radius");
  if (radius === undefined) radius = null;
  _update_proximity_data(document, document.getFlag(MODULE_ID, "userlist"), { radius: radius });

  _update_volumes();
});

Hooks.on("deleteToken", (document, _options, _userId) => {
  if (_token_proximity_data.has(document.uuid)) {
    _delete_proximity_data(document);

    _update_volumes();
  } else if (document?.object?.isOwner) {
    _update_volumes();
  }
});

Hooks.on("moveToken", async (token, updateData, _options, _userId) => {
  if (!_is_voice_active()) return;// should be unnecessary (why would you run this module without voice?) but this will prevent the animation function from unnecessarily running
  if (!token.object) return;// strange movetoken behavior when token is teleported from another scene via a teleport token region
  let should_update = false;
  if (canvas.tokens.ownedTokens.map(token => token.id).includes(token.id)) {
    should_update = true;
  } else if (typeof token.getFlag(MODULE_ID, "userlist") === "string" && token.getFlag(MODULE_ID, "userlist") !== "") {
    _update_proximity_data(token, { x: updateData.destination.x, y: updateData.destination.y, elevation: updateData.destination.elevation });
    should_update = true;
  }
  if (should_update) {
    const origin = updateData.origin;
    const destination = updateData.destination;
    const midpoint = token.getCenterPoint({ x: 0, y: 0, elevation: 0 });
    let options = { action: token.movementAction };
    const defaults = CONFIG.Token.movement.actions[options.action].getAnimationOptions(token);
    for (const key in defaults) options[key] ??= defaults[key];
    let duration = options.duration ?? token.object._getAnimationDuration(origin, destination, options);
    if (duration > 0) {
      let parent = {};
      let attributes = [];
      for (const attribute of ["x", "y", "elevation"]) {
        if (origin[attribute] === undefined || destination[attribute] === undefined) continue;
        parent[attribute] = origin[attribute] + (midpoint[attribute] ?? 0);
        attributes.push({
          from: origin[attribute] + (midpoint[attribute] ?? 0),
          to: destination[attribute] + (midpoint[attribute] ?? 0),
          attribute: attribute,
          parent: parent
        });
      }
      let data = {
        context: token,
        name: token.object.animationName + "Proximity",
        duration: duration,
        easing: options.easing,
        priority: PIXI.UPDATE_PRIORITY.OBJECTS,
        ontick: (_elapsedMS, _animation) => {
          // desyncs from the token's visual position if during the animation the token is made to move again
          // because the new animation fires immediately without waiting for the existing one to finish (unlike how the token actually moves visually)
          // don't know how to fix and doesn't seem likely to come up much
          _update_proximity_data(token, undefined, parent);
          _update_volumes();
        }
      };
      foundry.canvas.animation.CanvasAnimation.animate(attributes, data).then(() => {
        _update_proximity_data(token, undefined, parent);
        _update_volumes();
      });
    } else {
      _update_proximity_data(token, undefined, {
        x: destination.x + (midpoint.x ?? 0),
        y: destination.y + (midpoint.y ?? 0),
        elevation: destination.elevation + (midpoint.elevation ?? 0)
      });
      // token position within _update_volumes isn't updated until after this hook resolves
      // which is only an issue for teleportation because it only updates volume once, inside this hook
      setTimeout(() => {
        _update_volumes();
      }, 100);
    }
  }
});

Hooks.on("controlToken", () => {
  _update_volumes();// because volume is based on controlled tokens or owned tokens, so any control change could change the volume
});

Hooks.on("updateWall", (_document, _changed, _options, _userId) => {
  // recalculate pointsoundsource for all proximity tokens if any wall is updated since it can affect audio line of sight
  Array.from(_token_proximity_data.values()).forEach((proximity_token) => {
    proximity_token.soundsource.initialize();
  });
  _update_volumes();
});

Hooks.on("renderCameraViews", (_application, _element, _context, _options) => {
  // add GM specific buttons
  if (game.user.isGM) {
    _add_gm_voice_buttons(document.querySelector(".user-controls[data-user=\"" + game.user.id + "\"]:not([hidden] .user-controls)"));
  }

  // re-rendering the cameraviews sidebar resets video.volume so it has to be updated again
  _update_volumes();

  // additional update but with a delay due to when someone first joins the voice chat the video element('s volume) gets update slightly after
  // this event resolves, not guaranteed to work due to differences in delay but unfortunately there's no proper hook for "player has joined VC"
  setTimeout(() => {
    _update_volumes();
  }, 500);
});

Hooks.on("rtcSettingsChanged", (_settings, changed) => {
  if (!changed?.client?.users) return;
  if (Object.values(changed.client.users).some((user) => user.volume !== undefined)) {
    _update_volumes();
  }
});

Hooks.on("renderSettingsConfig", (_application, element, _context, _options) => {
  if (game.user.isGM) return;
  // remove the globalListen setting from appearing in the settings menu for non-GMs
  element.querySelector('.form-group:has(#settings-config-' + MODULE_ID + '\\.globalListen)')?.remove();
  // if the settings tab would then become empty remove it and the button that opens it
  if (element.querySelector('.tab[data-tab="' + MODULE_ID + '"')?.childElementCount === 0) {
    element.querySelector('.tabs button[data-tab="' + MODULE_ID + '"]')?.remove();
    element.querySelector('.tab[data-tab="' + MODULE_ID + '"')?.remove();
  }
})



function _update_button_class(button, active) {
  if (active) {
    button.classList.add("active");
  } else {
    button.classList.remove("active");
  }
}

const _gm_global_listen = document.createElement("button");
const _gm_global_speak = document.createElement("button");

Hooks.once("i18nInit", () => {
  _gm_global_listen.setAttribute("aria-label", game.i18n.localize("proximity-voice-chat.UI.globalListen.Hover"));
  _gm_global_speak.setAttribute("aria-label", game.i18n.localize("proximity-voice-chat.UI.globalSpeak.Hover"));
});

_gm_global_listen.classList.add(..."av-control inline-control toggle icon fa-solid fa-fw fa-podcast".split(" "));
_gm_global_listen.setAttribute("data-tooltip", "");
_gm_global_listen.onclick = async () => {
  const current = game.settings.get(MODULE_ID, "globalListen");
  await game.settings.set(MODULE_ID, "globalListen", !current);
  _update_button_class(_gm_global_listen, !current);
  _update_volumes();
};

_gm_global_speak.classList.add(..."av-control inline-control toggle icon fa-solid fa-fw fa-bullhorn".split(" "));
_gm_global_speak.setAttribute("data-tooltip", "");
_gm_global_speak.onclick = async () => {
  const current = game.user.getFlag(MODULE_ID, "global_speaker");
  await game.user.setFlag(MODULE_ID, "global_speaker", !current);
  _update_button_class(_gm_global_speak, !current);
};

/**
 * adds GM proximity voice buttons to the given element, intended to add to the CameraViews sidebar
 * @param {HTMLElement} element the element to add the GM camera view buttons to
 */
function _add_gm_voice_buttons(element) {
  _update_button_class(_gm_global_listen, game.settings.get(MODULE_ID, "globalListen"));
  _update_button_class(_gm_global_speak, game.user.getFlag(MODULE_ID, "global_speaker"));

  element.appendChild(_gm_global_listen);
  element.appendChild(_gm_global_speak);
}



Hooks.on("renderTokenHUD", (application, element, _context, _options) => {
  if (!game.user.isGM) return;
  _add_token_list_toggle(element, application.document);
});

const _gm_token_list_toggle = document.createElement("button");
const _gm_token_list_toggle_icon = document.createElement("i");
_gm_token_list_toggle.appendChild(_gm_token_list_toggle_icon);
_gm_token_list_toggle.classList.add("control-icon");
_gm_token_list_toggle_icon.classList.add(..."fa-solid fa-podcast".split(" "));
_gm_token_list_toggle.setAttribute("data-tooltip", "HUD.proximity-toggle-speaker.Hover");
_gm_token_list_toggle.onclick = async () => {
  const token_uuid = _gm_token_list_toggle.getAttribute("data-token-uuid");
  if (!token_uuid) return;
  let token = await fromUuid(token_uuid);
  if (!token) return;
  const userlist = _token_proximity_data.get(token.uuid)?.userlist ?? [];
  if (userlist.includes(game.user.uuid)) {
    await remove_user_from_userlist(token, game.user.uuid);
  } else {
    await add_user_to_userlist(token, game.user.uuid);
  }
};

function _add_token_list_toggle(element, token) {
  _gm_token_list_toggle.setAttribute("data-token-uuid", token.uuid);
  _update_button_class(_gm_token_list_toggle, _token_proximity_data.get(token.uuid)?.userlist.includes(game.user.uuid));
  element.querySelector(".col.left").appendChild(_gm_token_list_toggle);
}