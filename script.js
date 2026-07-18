/* ============================================
   SPLINE LOGO REMOVAL
   ============================================ */
(function hideSplineLogo() {
    const viewer = document.querySelector('spline-viewer');
    if (!viewer) return;

    const hideLogo = () => {
        const shadowRoot = viewer.shadowRoot;
        const logo = shadowRoot?.querySelector('#logo');
        if (!logo) return false;

        if (!shadowRoot.querySelector('#portfolio-spline-logo-style')) {
            const style = document.createElement('style');
            style.id = 'portfolio-spline-logo-style';
            style.textContent = '#logo { display: none !important; visibility: hidden !important; }';
            shadowRoot.appendChild(style);
        }

        logo.setAttribute('aria-hidden', 'true');
        return true;
    };

    customElements.whenDefined('spline-viewer').then(() => {
        let attempts = 0;
        const logoCheck = window.setInterval(() => {
            attempts += 1;
            if (hideLogo() || attempts === 100) window.clearInterval(logoCheck);
        }, 100);
    });
})();

/* ============================================
   PARTICLE SYSTEM
   ============================================ */
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles(count) {
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2.5 + 1.0,
                alpha: Math.random() * 0.45 + 0.35,
                baseAlpha: Math.random() * 0.45 + 0.35,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Mouse interaction — attraction/glow
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const interactionRadius = 280;
            if (dist < interactionRadius) {
                const force = (interactionRadius - dist) / interactionRadius;
                // Gentle repulsion
                p.x += dx * force * 0.035;
                p.y += dy * force * 0.035;
                // Glow boost near mouse
                ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
                ctx.shadowBlur = 10 * force;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
            ctx.fill();
        }

        // Reset shadow for connections
        ctx.shadowBlur = 0;

        // Draw connections between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160) {
                    const alpha = (1 - dist / 160) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }

        animationId = requestAnimationFrame(draw);
    }

    function init() {
        resize();
        const particleCount = Math.min(Math.floor(window.innerWidth * 0.06), 90);
        createParticles(particleCount);
        draw();
    }

    window.addEventListener('resize', () => {
        resize();
        createParticles(Math.min(Math.floor(window.innerWidth * 0.05), 70));
    });

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Reset mouse when leaving window
    document.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    init();
})();

/* ============================================
   INTERACTIVE TERMINAL
   ============================================ */
(function initInteractiveTerminal() {
    const terminalBody = document.getElementById('terminalBody');
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');

    if (!terminalBody || !terminalInput || !terminalOutput) return;

    const ARCH_LOGO = [
        "                   -",
        "                  .o+",
        "                 `ooo/",
        "                `+oooo:",
        "               `+oooooo:",
        "               -+oooooo+:",
        "             `/:-:++oooo+:",
        "            `/++++/+++++++:",
        "           `/++++++++++++++:",
        "          `/+++ooooooooooooo/",
        "         ./ooosssso++osssssso+",
        "        .oossssso-````/ossssss+",
        "       -osssssso.      :ssssssso.",
        "      :osssssss/        osssso+++",
        "     /ossssssss/        +ssssooo/-",
        "   `/ossssso+/:-        -:/+osssso+-",
        "  `+sso+:-`                 `.-/+oso:",
        " `++:.                           `-+/",
        " .`                                 `"
    ].join('\n');

    const commands = {
        help: {
            desc: 'Show available commands',
            run: () => {
                const entries = Object.entries(commands).map(([name, cmd]) =>
                    `  <span style="color:var(--purple-light)">${name.padEnd(12)}</span>${cmd.desc}`
                ).join('\n');
                return '\nAvailable commands:\n' + entries + '\n';
            }
        },
        whoami: {
            desc: 'Display user info',
            run: () => '\nUjjwal Singh\nClass 12 student\nFrontend developer\nArch Linux user\nBuilder of unnecessarily over-engineered side projects.\n'
        },
        projects: {
            desc: 'List projects',
            run: () => '\nCubeRanked\nMCSR Ranked Website\nWeathermap\nPlanet News\nKashdog\nAllJavaCodes\n'
        },
        skills: {
            desc: 'List technical skills',
            run: () => '\nHTML\nCSS\nJavaScript\nReact\nTypeScript\nNode.js\nSocket.io\nGit\nLinux\n'
        },
        github: {
            desc: 'Show GitHub profile',
            run: () => '\ngithub.com/JustUjjwalGit\n'
        },
        neofetch: {
            desc: 'Show system info',
            run: () => {
                return '\n<div class="neofetch-output">' +
                    '<div class="neofetch-ascii">' + ARCH_LOGO + '</div>' +
                    '<div class="neofetch-info">' +
                        '<span class="nf-label">OS:       </span><span class="nf-value">Arch Linux x86_64</span>\n' +
                        '<span class="nf-label">DE:       </span><span class="nf-value">Hyprland (Wayland)</span>\n' +
                        '<span class="nf-label">WM:       </span><span class="nf-value">Hyprland</span>\n' +
                        '<span class="nf-label">Terminal: </span><span class="nf-value">Kitty</span>\n' +
                        '<span class="nf-label">Shell:    </span><span class="nf-value">zsh</span>\n' +
                        '<span class="nf-label">Editor:   </span><span class="nf-value">VS Code + Neovim</span>' +
                    '</div></div>\n';
            }
        },
        clear: {
            desc: 'Clear terminal',
            run: () => {
                terminalOutput.innerHTML = '';
                return '';
            }
        },
        tetris: {
            desc: 'Launch terminal Tetris',
            run: () => {
                terminalInput.blur();
                setTimeout(() => startTetris(terminalOutput, terminalBody), 200);
                return '\nLaunching Tetris...\n\n' +
                    '  Controls:\n' +
                    '  <span style="color:var(--purple-light)">← →</span>  Move\n' +
                    '  <span style="color:var(--purple-light)">↑</span>     Rotate\n' +
                    '  <span style="color:var(--purple-light)">↓</span>     Soft Drop\n' +
                    '  <span style="color:var(--purple-light)">Space</span>  Hard Drop\n' +
                    '  <span style="color:var(--purple-light)">Q</span>     Quit\n\n' +
                    'Good luck.\n';
            }
        }
    };

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function processCommand(input) {
        const trimmed = input.trim().toLowerCase();
        if (!trimmed) return '';

        const cmd = commands[trimmed];
        if (!cmd) {
            return `\n<span style="color:#ef4444">zsh: command not found: ${escapeHtml(trimmed)}</span>\n` +
                `<span style="color:var(--text-dim);font-size:0.75rem">Type 'help' for available commands.</span>\n`;
        }
        return cmd.run();
    }

    function addOutput(content) {
        if (!content) return;
        const line = document.createElement('div');
        line.className = 'terminal-output-line';
        line.innerHTML = content;
        terminalOutput.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function addCommandEcho(cmd) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="prompt">ujjwal@archlinux</span>:<span class="path">~</span>$ <span class="cmd">${escapeHtml(cmd)}</span>`;
        terminalOutput.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cmd = terminalInput.value;
            terminalInput.value = '';
            addCommandEcho(cmd);
            const result = processCommand(cmd);
            addOutput(result);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        // Up arrow to recall last command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
        }
    });

    // Focus input when clicking anywhere in the terminal body
    terminalBody.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
            terminalInput.focus();
        }
    });

})();

/* ============================================
   TERMINAL TETRIS
   ============================================ */
function startTetris(container, terminalBody) {
    const TETRIS_COLS = 10;
    const TETRIS_ROWS = 20;
    const BLOCK_SIZE = 20;

    // Remove existing tetris if any
    const existing = container.querySelector('.tetris-container');
    if (existing) existing.remove();

    // Expand terminal
    const terminalWindow = container.closest('.terminal-window');
    if (terminalWindow) {
        terminalWindow.classList.add('terminal-expanded');
        // Calculate exact height for smooth animation
        const expandedHeight = TETRIS_ROWS * BLOCK_SIZE + 160;
        terminalBody.style.maxHeight = expandedHeight + 'px';
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'tetris-container';

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'tetris-score';
    scoreDisplay.textContent = 'Score: 0';
    wrapper.appendChild(scoreDisplay);

    const canvas = document.createElement('canvas');
    canvas.className = 'tetris-canvas';
    canvas.width = TETRIS_COLS * BLOCK_SIZE;
    canvas.height = TETRIS_ROWS * BLOCK_SIZE;
    wrapper.appendChild(canvas);

    container.appendChild(wrapper);

    const ctx = canvas.getContext('2d');
    const COLORS = [
        null,
        '#a855f7', // purple (I)
        '#818cf8', // indigo (O)
        '#c084fc', // violet (T)
        '#7c3aed', // deep purple (S)
        '#f472b6', // pink (Z)
        '#22d3ee', // cyan (J)
        '#fbbf24', // amber (L)
    ];

    const SHAPES = [
        null,
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
        [[1,1],[1,1]],                               // O
        [[0,1,0],[1,1,1],[0,0,0]],                   // T
        [[0,1,1],[1,1,0],[0,0,0]],                   // S
        [[1,1,0],[0,1,1],[0,0,0]],                   // Z
        [[1,0,0],[1,1,1],[0,0,0]],                   // J
        [[0,0,1],[1,1,1],[0,0,0]],                   // L
    ];

    let board = Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0));
    let currentPiece = null;
    let currentType = 0;
    let currentX = 0;
    let currentY = 0;
    let score = 0;
    let gameOver = false;
    let dropInterval = null;
    let tetrisRunning = true;

    function randomPiece() {
        return Math.floor(Math.random() * 7) + 1;
    }

    function spawnPiece() {
        currentType = randomPiece();
        const shape = SHAPES[currentType];
        currentX = Math.floor((TETRIS_COLS - shape[0].length) / 2);
        currentY = 0;
        currentPiece = shape;

        if (collision(currentX, currentY, shape)) {
            gameOver = true;
            clearInterval(dropInterval);
            draw();
            return false;
        }
        return true;
    }

    function collision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const bx = x + col;
                    const by = y + row;
                    if (bx < 0 || bx >= TETRIS_COLS || by >= TETRIS_ROWS || by < 0) return true;
                    if (by >= 0 && board[by][bx]) return true;
                }
            }
        }
        return false;
    }

    function lockPiece() {
        if (!currentPiece) return;
        for (let row = 0; row < currentPiece.length; row++) {
            for (let col = 0; col < currentPiece[row].length; col++) {
                if (currentPiece[row][col]) {
                    const bx = currentX + col;
                    const by = currentY + row;
                    if (by >= 0 && by < TETRIS_ROWS && bx >= 0 && bx < TETRIS_COLS) {
                        board[by][bx] = currentType;
                    }
                }
            }
        }
        clearLines();
        if (!spawnPiece()) {
            gameOver = true;
        }
        draw();
    }

    function clearLines() {
        let cleared = 0;
        for (let row = TETRIS_ROWS - 1; row >= 0; ) {
            if (board[row].every(c => c !== 0)) {
                board.splice(row, 1);
                board.unshift(Array(TETRIS_COLS).fill(0));
                cleared++;
            } else {
                row--;
            }
        }
        if (cleared > 0) {
            score += cleared * 100 * cleared;
            scoreDisplay.textContent = 'Score: ' + score;
        }
    }

    function draw() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= TETRIS_COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= TETRIS_ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(canvas.width, y * BLOCK_SIZE);
            ctx.stroke();
        }

        // Draw board
        for (let row = 0; row < TETRIS_ROWS; row++) {
            for (let col = 0; col < TETRIS_COLS; col++) {
                if (board[row][col]) {
                    drawBlock(ctx, col, row, COLORS[board[row][col]]);
                }
            }
        }

        // Draw current piece
        if (currentPiece && !gameOver) {
            for (let row = 0; row < currentPiece.length; row++) {
                for (let col = 0; col < currentPiece[row].length; col++) {
                    if (currentPiece[row][col]) {
                        drawBlock(ctx, currentX + col, currentY + row, COLORS[currentType]);
                    }
                }
            }
        }

        // Ghost piece (preview where it lands)
        if (currentPiece && !gameOver) {
            let ghostY = currentY;
            while (!collision(currentX, ghostY + 1, currentPiece)) {
                ghostY++;
            }
            for (let row = 0; row < currentPiece.length; row++) {
                for (let col = 0; col < currentPiece[row].length; col++) {
                    if (currentPiece[row][col]) {
                        const px = (currentX + col) * BLOCK_SIZE;
                        const py = (ghostY + row) * BLOCK_SIZE;
                        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px + 1.5, py + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3);
                    }
                }
            }
        }

        // Game over overlay
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#a855f7';
            ctx.font = 'bold 16px "Share Tech Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 6);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '11px "Share Tech Mono", monospace';
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 16);
            ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
            ctx.font = '10px "Share Tech Mono", monospace';
            ctx.fillText('Press Q to exit', canvas.width / 2, canvas.height / 2 + 36);
        }
    }

    function drawBlock(ctx, x, y, color) {
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, 3);
        ctx.fillRect(px + 1, py + 1, 3, BLOCK_SIZE - 2);
    }

    function movePiece(dx, dy) {
        if (!currentPiece || gameOver) return;
        if (!collision(currentX + dx, currentY + dy, currentPiece)) {
            currentX += dx;
            currentY += dy;
            draw();
        } else if (dy > 0) {
            lockPiece();
        }
    }

    function rotatePiece() {
        if (!currentPiece || gameOver) return;
        const rotated = currentPiece[0].map((_, idx) =>
            currentPiece.map(row => row[idx]).reverse()
        );
        if (!collision(currentX, currentY, rotated)) {
            currentPiece = rotated;
            draw();
        }
    }

    function hardDrop() {
        if (!currentPiece || gameOver) return;
        while (!collision(currentX, currentY + 1, currentPiece)) {
            currentY++;
        }
        lockPiece();
        draw();
    }

    function cleanup() {
        tetrisRunning = false;
        clearInterval(dropInterval);
        document.removeEventListener('keydown', keyHandler);
        if (terminalWindow) {
            terminalWindow.classList.remove('terminal-expanded');
            terminalBody.style.maxHeight = '';
        }
        const ti = document.getElementById('terminalInput');
        if (ti) ti.focus();
    }

    const keyHandler = (e) => {
        if (!tetrisRunning) return;
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
            case 'q':
            case 'Q':
                e.preventDefault();
                cleanup();
                break;
        }
    };

    document.addEventListener('keydown', keyHandler);

    if (spawnPiece()) {
        draw();
        dropInterval = setInterval(() => {
            if (!gameOver && tetrisRunning) {
                movePiece(0, 1);
            }
        }, 400);
    }
}

/* ============================================
   SCROLL PROGRESS INDICATOR
   ============================================ */
(function initScrollProgress() {
    const progress = document.getElementById('scrollProgress');
    const ship = document.getElementById('scrollShip');
    if (!progress || !ship) return;

    let ticking = false;
    let visible = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progressPct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

                // Track height in px (180px container, minus ship height (~18px))
                const trackHeight = 162;
                const shipTop = progressPct * trackHeight;
                ship.style.top = shipTop + 'px';

                // Show after scrolling a bit
                if (scrollTop > 200 && !visible) {
                    progress.classList.add('visible');
                    visible = true;
                } else if (scrollTop <= 200 && visible) {
                    progress.classList.remove('visible');
                    visible = false;
                }

                ticking = false;
            });
            ticking = true;
        }
    });
})();

/* ============================================
   MOUSE GLOW
   ============================================ */
(function initMouseGlow() {
    const glow = document.getElementById('mouseGlow');
    if (!glow) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    function animate() {
        x += (targetX - x) * 0.08;
        y += (targetY - y) * 0.08;
        glow.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
        requestAnimationFrame(animate);
    }

    animate();
})();

/* ============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================ */
(function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        }
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
    });

    for (const el of revealElements) {
        observer.observe(el);
    }
})();

/* ============================================
   SMOOTH PARALLAX FOR HERO TEXT
   ============================================ */
(function initParallax() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');

    if (!hero || !heroContent) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                const scrollY = window.scrollY;
                const offset = scrollY * 0.15;

                if (rect.bottom > 0) {
                    heroContent.style.transform = `translateY(${offset}px)`;
                    heroContent.style.transition = 'transform 0.1s ease-out';
                }

                ticking = false;
            });
            ticking = true;
        }
    });
})();

/* ============================================
   MOBILE MENU TOGGLE
   ============================================ */
(function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');

    if (!btn || !menu) return;

    const closeMenu = () => {
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
        document.body.style.overflow = '';
    };

    btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('active');
        btn.classList.toggle('active', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    const links = menu.querySelectorAll('a');
    for (const link of links) {
        link.addEventListener('click', closeMenu);
    }

    menu.addEventListener('click', (event) => {
        if (event.target === menu) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('active')) closeMenu();
    });
})();
