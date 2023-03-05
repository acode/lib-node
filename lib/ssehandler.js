function readListeners (obj) {
    let copyObj = typeof obj === 'object'
      ? Array.isArray(obj)
        ? {}
        : obj || {}
      : {};
    let listeners = {};
    Object.keys(copyObj).forEach(function (key) {
      if (typeof copyObj[key] === 'function') {
        listeners[key] = copyObj[key];
      } else {
        listeners[key] = (function () {});
      }
    });
    return listeners;
  };

class SSEHandler {

  constructor (streamListeners, debugListeners, responseListener) {
    this.processing = '';
    this.streamListeners = readListeners(streamListeners);
    this.debugListeners = readListeners(debugListeners);
    this.responseListeners = readListeners({'@response': responseListener});
    this.events = {};
  }

  process (text) {
    let entries = [];
    if (text) {
      this.processing = this.processing + text;
      entries = this.processing.split('\n\n');
      let lastEntry = entries.pop();
      this.processing = lastEntry;
    }
    entries
      .filter(entry => !!entry)
      .forEach(entry => {
        let id = null;
        let event = 'message';
        let time = new Date().toISOString();
        let data = '';
        let lines = entry.split('\n').map((line, i) => {
          let lineData = line.split(':');
          let type = lineData[0];
          let contents = lineData.slice(1).join(':');
          if (contents[0] === ' ') {
            contents = contents.slice(1);
          }
          if (type === 'event' && !data) {
            event = contents;
          } else if (type === 'data') {
            if (data) {
              data = data + '\n' + contents;
            } else {
              data = contents;
            }
          } else if (type === 'id') {
            id = contents;
            let date = new Date(id.split('/')[0]);
            if (date.toString() !== 'Invalid Date') {
              time = date.toISOString();
            }
          }
        });
        this.events[event] = this.events[event] || [];
        let name = event;
        let value = JSON.parse(data);
        let eventData = {
          id: id,
          event: name,
          data: value,
          time: time,
          index: this.events[event].length
        };
        this.events[event].push(eventData);
        if (this.streamListeners[event]) {
          this.streamListeners[event].call(
            null,
            name,
            value,
            eventData
          );
        }
        if (this.streamListeners['*'] && !event.startsWith('@')) {
          this.streamListeners['*'].call(
            null,
            name,
            value,
            eventData
          );
        }
        if (this.debugListeners[event]) {
          this.debugListeners[event].call(
            null,
            name,
            value,
            eventData
          );
        }
        if (this.debugListeners['*'] && event !== '@response') {
          this.debugListeners['*'].call(
            null,
            name,
            value,
            eventData
          );
        }
        if (this.responseListeners[event]) {
          this.responseListeners[event].call(
            null,
            name,
            value,
            eventData
          );
        }
      })
    }

  }

  module.exports = SSEHandler;
