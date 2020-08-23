import React from 'react';

import { main } from './index.module.scss';

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  async componentDidMount() {
    // @see: https://github.com/and-who/react-p5-wrapper/issues/2#issuecomment-304523713
    const p5 = await import('p5').then((m) => m.default);
    this.p5 = new p5((sketch) => {
      sketch.setup = () => {
        sketch.createCanvas(200, 200);
      };
      sketch.draw = () => {
        sketch.background(0, 0, 0);
        sketch.noFill();
        sketch.stroke(255);
        sketch.bezier(250, 250, 0, 100, 100, 0, 100, 0, 0, 0, 100, 0);
      };
    }, this.ref.current);
  }

  render() {
    return <main className={main} ref={this.ref}></main>;
  }
}
