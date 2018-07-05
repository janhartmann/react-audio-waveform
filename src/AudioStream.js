import React from "react";
import PropTypes from "prop-types";

import { pad, addWaveHeader, concat } from "./utils";
import { Oscilloscope } from "./Oscilloscope";

export class AudioStream extends React.PureComponent {
  static propTypes = {
    audioContext: PropTypes.object.isRequired,
    buffer: PropTypes.array,
    header: PropTypes.object,
    onStop: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      analyser: props.audioContext.createAnalyser(),
      audioNodes: [],
      audioStack: [],
      nextTime: 0,
      sampleRate: 0,
      numberOfChannels: 0,
      rest: null,
      startedAt: null
    };

    this.timeout = null;
  }

  componentDidMount() {
    const { header } = this.props;
    const view = new DataView(header.slice(0, 44));
    this.setState(
      {
        sampleRate: view.getUint32(24, true),
        numberOfChannels: view.getUint16(22, true)
      },
      () => {
        this.process(header.slice(44));
        this.stream();
      }
    );
  }

  componentDidUpdate(prevProps) {
    const { buffer } = this.props;
    if (buffer !== prevProps.buffer) {
      this.process(buffer.slice(-1).pop().buffer);
    }
  }

  componentWillUnmount() {
    const { audioContext, onStop } = this.props;
    const { startedAt } = this.state;

    clearTimeout(this.timeout);
    this.timeout = null;

    if (this.audioNodes && this.audioNodes.length) {
      this.audioNodes.forEach(node => {
        node.stop();
        node.disconnect();
      });
    }

    if (onStop) {
      const offset = audioContext.currentTime - startedAt;
      onStop(offset);
    }
  }

  process = async buffer => {
    const { audioContext } = this.props;
    const { rest, numberOfChannels, sampleRate } = this.state;

    if (rest !== null) {
      buffer = concat(rest, buffer);
    }

    if (buffer.byteLength % 2 !== 0) {
      this.setState({
        rest: buffer.slice(-2, -1)
      });
      buffer = buffer.slice(0, -1);
    } else {
      this.setState({
        rest: null
      });
    }

    const audioBuffer = await audioContext.decodeAudioData(
      addWaveHeader(buffer, numberOfChannels, sampleRate)
    );

    /**
     * We need to check whether or not the timeout has been cleared
     * during decoding, or else React throws us a warning.
     */
    if (this.timeout) {
      this.setState(prevState => ({
        audioStack: [...prevState.audioStack, { buffer: audioBuffer }]
      }));
    }
  };

  stream = () => {
    const { audioContext } = this.props;
    const { startedAt, audioStack, analyser } = this.state;
    let { nextTime } = this.state;

    while (
      audioStack.length > 0 &&
      audioStack[0].buffer !== undefined &&
      nextTime < audioContext.currentTime + 2
    ) {
      const currentTime = audioContext.currentTime;
      const segment = audioStack.shift();

      if (startedAt <= 0) {
        this.setState({
          startedAt: currentTime
        });
      }

      const source = audioContext.createBufferSource();
      source.buffer = pad(segment.buffer);
      source.connect(analyser);
      source.connect(audioContext.destination);

      let duration = source.buffer.duration;
      let offset = 0;

      if (currentTime > nextTime) {
        offset = currentTime - nextTime;
        nextTime = currentTime;
        duration = duration - offset;
      }

      source.start(nextTime, offset);
      source.stop(nextTime + duration);

      // Make the next buffer wait the length of the last buffer before being played
      this.setState(prevState => ({
        nextTime: prevState.nextTime + duration,
        audioNodes: [...prevState.audioNodes, source]
      }));
    }

    this.timeout = setTimeout(this.stream, 500);
  };

  render() {
    const { analyser } = this.state;
    return <Oscilloscope analyser={analyser} color="red" />;
  }
}
