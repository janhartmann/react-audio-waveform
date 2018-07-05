import React from "react";
import PropTypes from "prop-types";

export class Waveform extends React.PureComponent {
  static propTypes = {
    currentTime: PropTypes.number.isRequired,
    audioBuffer: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    waveColor: PropTypes.string,
    progressColor: PropTypes.string,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  };

  static defaultProps = {
    currentTime: 0,
    waveColor: "gray",
    progressColor: "blue",
    width: 500,
    height: 50
  };

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate(prevProps) {
    const { currentTime } = this.props;
    if (currentTime !== prevProps.currentTime) {
      this.draw();
    }
  }

  draw = () => {
    const { currentTime, waveColor, progressColor } = this.props;

    const context = this.canvas.getContext("2d");
    const {
      minPoints,
      maxPoints,
      ratio,
      pixelPerSecond,
      amp
    } = this.getPointsData();

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var k = 0; k < minPoints.length; k++) {
      const minPoint = minPoints[k] / ratio;
      const maxPoint = maxPoints[k] / ratio;

      context.fillStyle =
        currentTime * pixelPerSecond < k ? waveColor : progressColor;

      context.fillRect(
        k,
        (1 + minPoint) * amp,
        1,
        Math.max(1, (maxPoint - minPoint) * amp)
      );
    }
  };

  getPointsData = () => {
    const { audioBuffer } = this.props;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / this.canvas.width);

    let minPoints = [];
    let maxPoints = [];
    for (var i = 0; i < this.canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) {
          min = datum;
        }
        if (datum > max) {
          max = datum;
        }
      }

      minPoints.push(min);
      maxPoints.push(max);
    }

    const ratio =
      Math.max(
        Math.abs(Math.min(...minPoints)),
        Math.abs(Math.max(...maxPoints))
      ) || 1;

    return {
      minPoints: minPoints,
      maxPoints: maxPoints,
      ratio: ratio,
      step: step,
      pixelPerSecond: this.canvas.width / audioBuffer.duration,
      amp: this.canvas.height / 2
    };
  };

  handleCanvasClick = evt => {
    const { onClick } = this.props;
    if (onClick) {
      const rect = this.canvas.getBoundingClientRect();
      const x =
        ((evt.clientX - rect.left) / (rect.right - rect.left)) *
        this.canvas.width;
      const y =
        ((evt.clientY - rect.top) / (rect.bottom - rect.top)) *
        this.canvas.height;

      onClick({
        x: x,
        y: y,
        percentage: x / this.canvas.width
      });
    }
  };

  getCanvasStyle = () => ({
    width: "500px",
    height: 50
  });

  render() {
    const style = this.getCanvasStyle();
    return (
      <canvas
        ref={ref => (this.canvas = ref)}
        style={style}
        onClick={this.handleCanvasClick}
      />
    );
  }
}
