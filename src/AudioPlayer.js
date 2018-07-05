import React from "react";
import PropTypes from "prop-types";

import { AudioStream } from "./AudioStream";
import { AudioPlayback } from "./AudioPlayback";
import { withAudioState, AudioState } from "./AudioContext";

class AudioPlayer extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
    audioState: PropTypes.string,
    onPlaybackEnd: PropTypes.func,
    options: PropTypes.object
  };

  static defaultProps = {
    audioState: AudioState.PLAY
  };

  constructor(props) {
    super(props);

    this.state = {
      streaming: false,
      bufferStack: [],
      audioBuffer: null,
      startPosition: 0,
      startedAt: 0,
      currentTime: 0
    };

    this.audioContext = this.createAudioContext();
  }

  componentDidMount() {
    const { url } = this.props;
    this.load(url);
  }

  componentDidUpdate(prevProps) {
    const { url, audioState } = this.props;
    if (url !== prevProps.url) {
      this.load(url);
    }
    if (audioState !== prevProps.audioState) {
      this.handleAudioState();
    }
  }

  componentWillUnmount() {
    this.cleanup();
  }

  createAudioContext = () =>
    new (window.AudioContext || window.webkitAudioContext)();

  /**
   * Resumes (plays) the AudioContext.
   */
  play = async () => {
    await this.audioContext.resume();
  };

  /**
   * Suspends (pauses) the AudioContext.
   */
  pause = async () => {
    await this.audioContext.suspend();
  };

  /**
   * Loads a audio resources and begins streaming it immediately.
   * @param {string} url the url to fetch the resource from.
   */
  load = async url => {
    this.cleanup();

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const response = await fetch(url, {
        ...this.props.options,
        signal: signal
      });
      const reader = response.body.getReader();
      let data = await reader.read();
      if (data) {
        this.startTimer();
        this.setState({
          streaming: true,
          header: data.value.buffer, // First chunk has the header.
          bufferStack: [
            {
              // We will still append it to the bufferStack for easier concat later on
              buffer: data.value.buffer
            }
          ]
        });

        // Now process the data until we are completely empty
        while (!data.done) {
          data = await reader.read();
          if (data && data.value && data.value.buffer) {
            this.setState(prevState => ({
              bufferStack: [
                ...prevState.bufferStack,
                { buffer: data.value.buffer }
              ]
            }));
          }
        }

        // Once we are done buffering, we switch to playback
        this.setState({
          streaming: false
        });
      }
    } catch (err) {
      if (!signal.aborted) {
        throw err;
      }
    }
  };

  startTimer = () => {
    this.setState(prevState => ({
      currentTime:
        prevState.startPosition +
        this.audioContext.currentTime -
        prevState.startedAt
    }));

    this.timerRequest = requestAnimationFrame(this.startTimer);
  };

  handleAudioState = async () => {
    const { audioState } = this.props;
    switch (audioState) {
      case AudioState.PLAY:
        await this.play();
        break;
      case AudioState.PAUSE:
        await this.pause();
        break;
    }
  };

  /**
   * When the stream is stopping, we will get the offset on where we need
   * to start the playback from.
   */
  handleStreamStop = offset => {
    this.setState({
      startPosition: offset
    });
  };

  handleSeek = position => {
    this.setState({
      startPosition: position,
      startedAt: this.audioContext.currentTime
    });
  };

  handlePlaybackEnd = () => {
    const { onPlaybackEnd } = this.props;
    this.handleSeek(0);
    this.pause();

    if (onPlaybackEnd) {
      onPlaybackEnd();
    }
  };

  cleanup = () => {
    if (this.timerRequest) {
      cancelAnimationFrame(this.timerRequest);
    }

    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = this.createAudioContext();
    }
  };

  render() {
    const {
      streaming,
      header,
      bufferStack,
      startPosition,
      currentTime
    } = this.state;

    return streaming ? (
      <AudioStream
        audioContext={this.audioContext}
        header={header}
        buffer={bufferStack}
        onStop={this.handleStreamStop}
      />
    ) : (
      <AudioPlayback
        audioContext={this.audioContext}
        buffer={bufferStack}
        startPosition={startPosition}
        currentTime={currentTime}
        onSeek={this.handleSeek}
        onEnd={this.handlePlaybackEnd}
      />
    );
  }
}

export default withAudioState(AudioPlayer);
