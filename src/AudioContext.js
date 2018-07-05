import React from "react";

export const AudioState = {
  PLAY: "play",
  PAUSE: "pause"
};

export const AudioContext = React.createContext(AudioState.PLAY);

export function withAudioState(Component) {
  return function AudioStateComponent(props) {
    return (
      <AudioContext.Consumer>
        {audioState => <Component {...props} audioState={audioState} />}
      </AudioContext.Consumer>
    );
  };
}
