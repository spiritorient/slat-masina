document.addEventListener("DOMContentLoaded", () => {
    const symbols = ["symbol1", "symbol2", "symbol3", "symbol4", "symbol5", "Medena"]; // Symbols for reels
    const reels = [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3"),
    ];
    const spinButton = document.getElementById("spin-button");
    const respinButton = document.getElementById("respin-button");
    const rechargeButton = document.getElementById("recharge-button"); // Recharge button
    const message = document.getElementById("message");
    const scoreElement = document.getElementById("score");
    const rechargeCounterElement = document.getElementById("recharge-counter"); // Recharge counter element

    let score = 0; // Player's starting score
    let respinCount = 0; // Track the number of consecutive respins
    let rechargeCount = 0; // Track the number of recharges
    let currentReel = 0; // Used for Super-Wildcard logic
    const spinPrice = 21; // Cost for a spin
    const respinPrice = 34; // Cost for a respin
    const rechargePoints = 300; // Recharge points

    // Function to start the game
    const startGame = () => {
        score = rechargePoints;
        rechargeCount = 0; // Reset recharge count when the game starts
        updateScore(0); // Initialize the score display
        updateRechargeCounter(); // Initialize the recharge counter display
        message.textContent = `Game started with ${rechargePoints} points!`;
    };

    // Update the score display
    const updateScore = (points) => {
        score += points;
        scoreElement.textContent = `Score: ${score}`;
        toggleRechargeButton(); // Toggle recharge button based on score
    };

    // Update the recharge counter display
    const updateRechargeCounter = () => {
        rechargeCounterElement.textContent = `Recharges: ${rechargeCount}`;
    };

    // Toggle visibility of the recharge button
    const toggleRechargeButton = () => {
        if (score < 50) {
            rechargeButton.style.display = "inline-block";
        } else {
            rechargeButton.style.display = "none";
        }
    };

    // Recharge functionality
    rechargeButton.addEventListener("click", () => {
        if (score < 50) {
            updateScore(rechargePoints);
            rechargeCount++;
            updateRechargeCounter(); // Update recharge counter on recharge
            message.textContent = "🎉 You recharged 300 points!";
        } else {
            message.textContent =
                "❌ Recharge only available when score is below 50.";
        }
    });

    // Function to animate a reel with delay and customizable total frames
    const animateReel = (reel, finalSymbol, delay, totalFrames) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const animationSymbols = [...symbols, ...symbols]; // Extend symbols array
                let animationIndex = 0;
                const frameDuration = 100; // Duration of each frame in milliseconds

                const animation = setInterval(() => {
                    if (animationIndex >= totalFrames) {
                        clearInterval(animation);
                        applyBackground(reel, finalSymbol); // Apply the final symbol
                        resolve();
                    } else {
                        const currentSymbol =
                            animationSymbols[animationIndex % animationSymbols.length];
                        applyBackground(reel, currentSymbol);
                        animationIndex++;
                    }
                }, frameDuration);
            }, delay);
        });
    };

    // Function to apply background images
    const applyBackground = (reel, symbol) => {
        const imagePath = `images/${symbol}.png`;
        reel.style.backgroundImage = `url(${imagePath})`;
        reel.style.backgroundSize = "contain";
        reel.style.backgroundRepeat = "no-repeat";
        reel.style.backgroundPosition = "center";
        reel.textContent = "";
    };

    // Spin the reels
    const spinReels = async () => {
        if (score < spinPrice) {
            message.textContent = "❌ Not enough points to spin!";
            return;
        }

        updateScore(-spinPrice); // Deduct spin price
        resetGame(); // Reset game state for a new round
        spinButton.disabled = true;
        respinButton.style.display = "none";
        let results = [];

        const animations = [];
        for (let i = 0; i < reels.length; i++) {
            const finalSymbol =
                symbols[Math.floor(Math.random() * symbols.length)];
            results.push(finalSymbol);

            // Assign different totalFrames to each reel
            const totalFrames = 5 + i * 5; // Reel 1: 5 frames, Reel 2: 10 frames, Reel 3: 15 frames
            const delay = 0; // All reels start at the same time

            animations.push(
                animateReel(reels[i], finalSymbol, delay, totalFrames)
            );
        }

        // Wait for all animations to complete
        await Promise.all(animations);

        // Check results after animation
        checkWin(results);
        spinButton.disabled = false; // Re-enable spin button
    };

    // Check for winning conditions
    const checkWin = (results) => {
        let medenaCount = 0;
        let messageText = ''; // Initialize an empty message

        // Count how many times "Medena" appears
        results.forEach((symbol) => {
            if (symbol === "Medena") {
                medenaCount++;
            }
        });

        // Deduct 3 points for each "Medena" appearance
        if (medenaCount > 0) {
            const deduction = medenaCount * 3;
            updateScore(-deduction);
            messageText += `😈 Medena appeared ${medenaCount} time(s)! You lost ${deduction} points! `;
        }

        // Check for Medena appearing on all three reels
        if (medenaCount === 3) {
            messageText += "Triggering Super-Wildcard Dino! ";
            message.textContent = messageText; // Set the accumulated message
            triggerSuperWildcard(true); // Pass true to indicate guaranteed first reel
            return; // Exit the function since we're triggering the Super-Wildcard
        }

        // Existing win conditions
        if (results[0] === results[1] && results[1] === results[2]) {
            messageText += `🎉 Jackpot! You gained 144 points!`;
            updateScore(144); // Jackpot reward
            audioJackpot.play(); // Play jackpot sound
            message.textContent = messageText; // Set the accumulated message
            endRound();
        } else if (
            results[0] === results[1] ||
            results[1] === results[2] ||
            results[0] === results[2]
        ) {
            messageText += `😊 Partial Win! You gained 13 points!`;
            updateScore(13); // Partial win reward
            message.textContent = messageText; // Set the accumulated message
            enableRespin(results); // Allow respin for partial win
        } else {
            if (medenaCount === 0) {
                messageText += "😞 Try Again!";
            }
            message.textContent = messageText; // Set the accumulated message
            endRound();
        }
    };

    // Enable the respin button for partial wins
    const enableRespin = (results) => {
        if (respinCount >= 3) {
            message.textContent = "❌ No more respins available!";
            respinButton.style.display = "none";
            endRound();
            return;
        }

        respinButton.textContent = `Respin (Cost: ${respinPrice})`;
        respinButton.style.display = "inline-block";
        respinButton.onclick = () => respin(results);
    };

    // Respin logic
    const respin = async (results) => {
        if (respinCount >= 3) {
            message.textContent = "❌ No more respins available!";
            respinButton.style.display = "none";
            endRound();
            return;
        }
        if (score < respinPrice) {
            message.textContent = "❌ Not enough points for a respin!";
            return;
        }

        updateScore(-respinPrice); // Deduct respin cost
        respinCount++;

        // Find the non-matching reel
        let nonMatchingIndex;
        if (results[0] === results[1]) nonMatchingIndex = 2;
        else if (results[1] === results[2]) nonMatchingIndex = 0;
        else nonMatchingIndex = 1;

        const finalSymbol =
            symbols[Math.floor(Math.random() * symbols.length)];
        results[nonMatchingIndex] = finalSymbol;

        // Animate the respinning reel with a longer animation
        const totalFrames = 15; // Use higher totalFrames for respin effect
        await animateReel(reels[nonMatchingIndex], finalSymbol, 0, totalFrames);

        // Initialize message text
        let messageText = '';

        // Check if "Medena" appeared on the respun reel
        if (finalSymbol === "Medena") {
            updateScore(34); // Reward the player
            messageText += `🎁 Medena appeared on the respun reel! You gained 34 points! `;
        }

        // Check for Medena on all three reels after respin
        let medenaCount = 0;
        results.forEach((symbol) => {
            if (symbol === "Medena") {
                medenaCount++;
            }
        });

        if (medenaCount === 3) {
            messageText += "Triggering Super-Wildcard Dino! ";
            message.textContent = messageText; // Display messages
            triggerSuperWildcard(true); // Start Super-Wildcard with guaranteed first reel
            return; // Exit the function
        }

        // After respin, check for a jackpot
        if (results[0] === results[1] && results[1] === results[2]) {
            messageText += `🎉 Jackpot! You gained 144 points!`;
            updateScore(144); // Jackpot reward
            audioJackpot.play(); // Play jackpot sound
            message.textContent = messageText;
            endRound();
            return;
        }

        // If respin limit reached, trigger Super-Wildcard
        if (respinCount === 3) {
            message.textContent = messageText; // Display any messages before triggering Super-Wildcard
            triggerSuperWildcard();
            return;
        }

        // No jackpot, continue game
        message.textContent = messageText;
    };

    // Load audio files
    const audioDinoStart = new Audio('audio/dino_start.mp3');
    const audioDinoReel1 = new Audio('audio/dino_reel1.mp3');
    const audioDinoReel2 = new Audio('audio/dino_reel2.mp3');
    const audioDinoReel3 = new Audio('audio/dino_reel3.mp3');
    const audioDinoFail1 = new Audio('audio/dino_fail1.mp3');
    const audioDinoFail2 = new Audio('audio/dino_fail2.mp3');
    const audioJackpot = new Audio('audio/jackpot_sound.mp3'); // Load jackpot sound

    // Super-Wildcard logic
    const triggerSuperWildcard = async (guaranteedFirstReel = false) => {
        if (!guaranteedFirstReel && Math.random() > 1 / 3) {
            message.textContent = "😞 No Super-Wildcard this time!";
            audioDinoFail1.play(); // Play failure sound
            endRound();
            return;
        }

        currentReel = 0;
        audioDinoStart.play(); // Play sound when Dino starts to appear

        const expandSuperWildcard = async () => {
            const totalFrames = 50; // Adjusted totalFrames to match sound length
            const frameDuration = 80; // Adjusted frame duration

            // Play the reel sound before starting the animation
            if (currentReel === 0) {
                audioDinoReel1.play();
            } else if (currentReel === 1) {
                audioDinoReel2.play();
            } else if (currentReel === 2) {
                audioDinoReel3.play();
            }

            await animateReelWithCustomFrameDuration(reels[currentReel], "Dino", 0, totalFrames, frameDuration);

            if (currentReel === 2) {
                message.textContent = "🎉 Super-Wildcard! Extraordinary Bonus!";
                updateScore(1000);
                endRound();
            } else {
                let expansionSuccess;
                if (guaranteedFirstReel && currentReel === 0) {
                    expansionSuccess = true;
                } else {
                    expansionSuccess = Math.random() <= 1 / 3;
                }

                if (expansionSuccess) {
                    currentReel++;
                    setTimeout(expandSuperWildcard, 500);
                } else {
                    // Play failure sounds after the reel animation
                    if (currentReel === 0) {
                        audioDinoFail1.play();
                    } else if (currentReel === 1) {
                        audioDinoFail2.play();
                    }
                    message.textContent = "😞 Dino failed to cum.";
                    endRound();
                }
            }
        };
        expandSuperWildcard();
    };

    // Modified animateReel function to accept frameDuration
    const animateReelWithCustomFrameDuration = (reel, finalSymbol, delay, totalFrames, frameDuration) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const animationSymbols = [...symbols, ...symbols]; // Extend symbols array
                let animationIndex = 0;

                const animation = setInterval(() => {
                    if (animationIndex >= totalFrames) {
                        clearInterval(animation);
                        applyBackground(reel, finalSymbol); // Apply the final symbol
                        resolve();
                    } else {
                        const currentSymbol =
                            animationSymbols[animationIndex % animationSymbols.length];
                        applyBackground(reel, currentSymbol);
                        animationIndex++;
                    }
                }, frameDuration);
            }, delay);
        });
    };

    // End the round
    const endRound = () => {
        respinButton.style.display = "none";
        spinButton.disabled = false;
    };

    // Reset the game state
    const resetGame = () => {
        message.textContent = "Ready for a new spin!";
        spinButton.disabled = false;
        respinButton.style.display = "none";
        respinCount = 0;
        reels.forEach((reel) => {
            reel.textContent = "";
            reel.style.backgroundImage = ""; // Clear backgrounds
        });
    };

    // Initialize game
    spinButton.addEventListener("click", spinReels);
    startGame();
});