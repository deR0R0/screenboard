const events: Record<string, any> = {}

async function on(event: string, callback: Function) {
    // check if this event already exists
    if(!events[event]) {
        events[event] = [];
    }

    // add the callback to the event's callback list
    events[event].push(callback);

    console.log("registered event: " + event);
}

async function emit(event: string, ...args: any[]) {
    // check if this event exists
    if(!events[event]) return;

    // call all callbacks associated with this event
    for(const callback of events[event]) {
        callback(...args);
    }

    console.log("emitted event: " + event);
}

export { on, emit };