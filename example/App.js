import React, { Component } from "react";

import { AudioPlayer, AudioContext, AudioState } from "react-audio-waveform";
import SampleWav from "./pm.wav";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioState: AudioState.PLAY
    };
  }

  render() {
    const { audioState } = this.state;
    return (
      <AudioContext.Provider value={audioState}>
        <AudioPlayer
          url={SampleWav}
          onPlaybackEnd={() => this.setState({ audioState: AudioState.PAUSE })}
        />
        <button
          onClick={() =>
            this.setState(prevState => ({
              audioState:
                prevState.audioState === AudioState.PLAY
                  ? AudioState.PAUSE
                  : AudioState.PLAY
            }))
          }
        >
          {audioState === AudioState.PLAY ? AudioState.PAUSE : AudioState.PLAY}
        </button>
      </AudioContext.Provider>
    );
  }
}
