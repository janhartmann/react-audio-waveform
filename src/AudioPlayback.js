import React from "react";
import PropTypes from "prop-types";

import { concats } from "./utils";
import { Waveform } from "./Waveform";

export class AudioPlayback extends React.Component {
  static propTypes = {
    buffer: PropTypes.any,
    audioContext: PropTypes.object.isRequired,
    startPosition: PropTypes.number,
    onSeek: PropTypes.func,
    onEnd: PropTypes.func,
    currentTime: PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      audioBuffer: null
    };

    this.source = null;
  }

  componentDidMount() {
    this.beginPlayBack();
  }

  componentDidUpdate(prevProps) {
    const { startPosition } = this.props;
    if (startPosition !== prevProps.startPosition) {
      this.playBack();
    }
  }

  /**
   * Begins playback of the buffered audio, by first decoding it and then looking at
   * how long we got by streaming. The last position of the streaming is then
   * set as an offset for the playback.
   */
  beginPlayBack = async () => {
    const { buffer, audioContext } = this.props;
    if (buffer && buffer.length > 0) {
      const audioBuffer = await audioContext.decodeAudioData(concats(buffer));
      this.setState(
        {
          audioBuffer: audioBuffer
        },
        () => {
          this.playBack();
        }
      );
    }
  };

  /**
   * Creates a AudioBufferSource for the start position of the audio playback.
   */
  playBack = () => {
    if (this.source) {
      this.source.removeEventListener("ended", this.onEnded);
      this.source.stop();
      this.source.disconnect();
    }

    this.source = this.createBufferSource();
  };

  /**
   * Buffer sources can only be played once, so this utility function creates
   * a new buffer source from the already buffered audio and starts in at
   * the set start position.
   */
  createBufferSource = () => {
    const { audioContext, startPosition } = this.props;
    const { audioBuffer } = this.state;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0, startPosition);
    source.addEventListener("ended", this.onEnded);
    return source;
  };

  /**
   * When the audio is done playing, we suspends the AudioContext,
   * but keeps the buffer in memory for easy playback.
   */
  onEnded = async () => {
    const { onEnd } = this.props;
    if (onEnd) {
      onEnd();
    }
    // This will build up the buffer source again for quick playing.
    this.playBack();
  };

  handleWaveformClick = evt => {
    const { onSeek } = this.props;
    if (onSeek) {
      const { audioBuffer } = this.state;
      const position = evt.percentage * audioBuffer.duration;
      onSeek(position);
    }
  };

  render() {
    const { audioBuffer } = this.state;
    const { currentTime } = this.props;
    if (audioBuffer) {
      return (
        <Waveform
          audioBuffer={audioBuffer}
          currentTime={currentTime}
          onClick={this.handleWaveformClick}
        />
      );
    }
    return null;
  }
}
