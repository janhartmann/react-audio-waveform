import React from "react";
import PropTypes from "prop-types";

export class Oscilloscope extends React.Component {
  static propTypes = {
    analyser: PropTypes.object.isRequired,
    color: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  };

  static defaultProps = {
    width: 500,
    height: 50
  };

  constructor(props) {
    super(props);
    this.oscilloscope = new Float32Array(props.analyser.frequencyBinCount);
  }

  componentDidMount() {
    this.updateOscilloscopeWaveform();
    this.draw();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.drawRequest);
    cancelAnimationFrame(this.updateRequest);
  }

  updateOscilloscopeWaveform = () => {
    const { analyser } = this.props;
    analyser.getFloatTimeDomainData(this.oscilloscope);
    this.updateRequest = requestAnimationFrame(this.updateOscilloscopeWaveform);
  };

  draw = () => {
    const { color } = this.props;

    if (this.canvas) {
      const context = this.canvas.getContext("2d");
      context.strokeStyle = color;
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.beginPath();
      for (let i = 0; i < this.oscilloscope.length; i++) {
        const x = i;
        const y = (0.5 + this.oscilloscope[i] / 2) * this.canvas.height;
        if (i == 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();

      this.drawRequest = requestAnimationFrame(this.draw);
    }
  };

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        ref={ref => (this.canvas = ref)}
        style={{ width: width, height: height }}
      />
    );
  }
}
