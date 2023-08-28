class AudioProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {
                name: 'gain',
                defaultValue: 0,
                minValue: 0,
                automationRate: 'a-rate',
            },
        ];
    }

    should = 0;
    velocity = 0;
    current = 0;

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        output.forEach((channel) => {
            for (let i = 0; i < channel.length; i++) {
                if (typeof (parameters['gain'][i]) != 'undefined')
                    this.should += parameters['gain'][i] / 2;
                this.should = this.should / 8 * 7;
                this.velocity += (this.should - this.current) / 4;
                this.current += this.velocity / 200;
                this.velocity = this.velocity / 400 * 399;
                channel[i] = Math.min(Math.max(this.current / 3, 0), .5);
            }
        });
        return true;
    }
}

registerProcessor('audioProcessor', AudioProcessor);
