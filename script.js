window.onkeydown = (e) => {
    if (e.which == 32) {
        requestAnimationFrame(async (timing) => {
            const audioContext = new AudioContext();
            await audioContext.audioWorklet.addModule('audioProcessor.js');
            const audioProcessor = new AudioWorkletNode(
                audioContext,
                'audioProcessor',
            );
            audioProcessor.connect(audioContext.destination);

            const gainParam = audioProcessor.parameters.get('gain');

            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            const gravity = .008;

            let millisecondsPerTick = 2;

            let adjustPositionX = 0;

            const ballRadius = 20;
            let ballPositionX = adjustPositionX;
            let ballPositionY = 0;
            let ballVelocityX = 0;
            let ballVelocityY = 0;

            let beforeAnimationX = [];
            let beforeAnimationY = [];

            let hidden = true;
            let adjust = true;

            const prices = [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                6,
                5,
                4,
                3,
                2,
                1,
            ];

            let uncountedTicks = 0;
            let pastTicks = 0;
            const frame = (time) => {
                if (changeTick) {
                    millisecondsPerTick *= 1.2;
                    pastTicks /= 1.2;
                    uncountedTicks /= 1.2;
                }

                while (time / millisecondsPerTick > pastTicks + uncountedTicks) {
                    if (hidden)
                        uncountedTicks++;
                    else
                        tick();
                }

                if (hidden) {
                    hidden = false;
                }

                render();

                requestAnimationFrame(frame);
            };

            let offsetPositionY = 0;
            let offsetVelocityY = 0;

            const bottomY = 14 * ballRadius * 3;

            const render = () => {
                ctx.fillStyle = 'rgb(255,255,255)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                offsetVelocityY -= (offsetPositionY - ballPositionY) / 2;
                offsetVelocityY /= 16;

                offsetPositionY += offsetVelocityY;

                let halfX = canvas.width / 2;
                let halfY = canvas.height / 2;
                halfY += offsetPositionY / 2;
                halfY -= 50;
                halfY -= canvas.height / 4;

                for (let i = beforeAnimationX.length - 1; i >= 0; i--) {
                    ctx.fillStyle = `rgba(0,0,0,${(i / beforeAnimationX.length) / 4})`;
                    ctx.beginPath();
                    ctx.arc(halfX + beforeAnimationX[i], halfY - beforeAnimationY[i], (i / beforeAnimationX.length) * ballRadius, 0, 2 * Math.PI);
                    ctx.fill();
                }

                ctx.fillStyle = 'rgb(55,0,0)';
                pins((x, y) => {
                    ctx.beginPath();
                    ctx.arc(halfX + x, halfY + y, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                ctx.fillStyle = 'rgb(0,0,0)';
                ctx.font = '16px myOpenSans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let x = .5; x < 13; x++) {
                    ctx.fillText(prices[Math.floor(x)], halfX + (x - 14 / 2 + .5) * ballRadius * 3, halfY + bottomY);
                }
            };

            const pins = (callback) => {
                for (let y = 5; y < 15; y++) {
                    for (let x = 0; x < y; x++) {
                        callback((x - y / 2 + .5) * ballRadius * 3, y * ballRadius * 3);
                    }
                }
            }

            const pinBallMaximumDistance = ballRadius + 5;

            const collision = (amount) => {
                gainParam.setValueAtTime(amount, audioContext.currentTime);
                gainParam.setValueAtTime(0, audioContext.currentTime + .0001);
            }

            let changeTick = false;

            const tick = () => {

                if (!adjust) {

                    const beforePositionY = ballPositionY;

                    ballVelocityY -= gravity;
                    ballPositionX += ballVelocityX;
                    ballPositionY += ballVelocityY;

                    pins((x, y) => {
                        const distance = Math.sqrt(Math.pow(ballPositionX - x, 2) + Math.pow(ballPositionY + y, 2));
                        if (distance < pinBallMaximumDistance) {
                            const angle = Math.atan2(ballPositionY + y, ballPositionX - x);
                            const distanceToMove = pinBallMaximumDistance - distance;
                            ballPositionX += Math.cos(angle) * distanceToMove;
                            ballPositionY += Math.sin(angle) * distanceToMove;
                            let tangentX = ballPositionY + y;
                            let tangentY = -(x - ballPositionX);
                            const magnitude = Math.sqrt(Math.pow(tangentX, 2) + Math.pow(tangentY, 2));
                            tangentX *= 1 / magnitude;
                            tangentY *= 1 / magnitude;
                            let relativeVelocityX = x - ballPositionX;
                            let relativeVelocityY = y + ballPositionY;
                            let dot = relativeVelocityX * tangentX + relativeVelocityY * tangentY;
                            const velocityComponentTangentX = tangentX * dot;
                            const velocityComponentTangentY = tangentY * dot;

                            collision(Math.sqrt(Math.pow(ballVelocityX, 2) + Math.pow(ballVelocityY, 2)));

                            ballVelocityX -= (relativeVelocityX - velocityComponentTangentX) / 20;
                            ballVelocityY += (relativeVelocityY - velocityComponentTangentY) / 20;
                        }
                    });

                    if (beforePositionY > -bottomY)
                        if (ballPositionY <= -bottomY)
                            if (ballPositionX < 390)
                                if (ballPositionX > -390) {
                                    document.getElementById('price').style.display = 'block';
                                    document.getElementById('won').innerHTML = 'You just won ' + prices[Math.floor((ballPositionX + 390) / (780 / prices.length))];
                                    changeTick = true;
                                }

                    if (ballPositionY < -1600)
                        reset();
                    if (Math.abs(ballPositionX) > 600)
                        reset();
                } else {
                    if (Math.abs(ballPositionX) > 200) {
                        if (ballPositionX > 200)
                            ballPositionX = 200;
                        if (ballPositionX < -200)
                            ballPositionX = -200;
                        adjustDirection = 0;
                    } else {
                        if (adjustDirection < 0) {
                            ballPositionX -= adjustScaleBegin - adjustScale;
                        } else if (adjustDirection > 0) {
                            ballPositionX += adjustScaleBegin - adjustScale;
                        } else {
                            adjustScale = adjustScaleBegin;
                        }
                        adjustScale -= adjustScale / 6000;
                    }
                }

                beforeAnimationX.push(ballPositionX);
                beforeAnimationY.push(ballPositionY);

                if (beforeAnimationX.length > 160) {
                    beforeAnimationX.shift();
                    beforeAnimationY.shift();
                }

                pastTicks++;
            };

            const reset = () => {
                ballPositionX = adjustPositionX;
                ballPositionY = 0;
                ballVelocityX = 0;
                ballVelocityY = 0;

                adjust = true;
            }

            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };

            window.onresize = resize;

            document.onvisibilitychange = () => {
                if (document.visibilityState === 'hidden') { hidden = true; }
            };

            let adjustScaleBegin = 1;
            let adjustScale = adjustScaleBegin;

            let adjustDirection = 0;

            window.onkeydown = (e) => {
                if (adjust) {
                    if (e.which == 37) {
                        adjustDirection = -1;
                    }
                    if (e.which == 39) {
                        adjustDirection = 1;
                    }
                    if (e.which == 40 && ballPositionX != adjustPositionX) {
                        adjustDirection = 0;
                        adjustPositionX = ballPositionX;
                        adjust = false;
                    }
                }
            };

            window.onkeyup = (e) => {
                if (adjust) {
                    if (e.which == 37)
                        adjustDirection = 0;
                    if (e.which == 39)
                        adjustDirection = 0;
                }
            };

            resize();
            frame(timing);
        });
    }
}