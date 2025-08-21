// VRMキャラクターチャットアプリ - 新バージョン
// 参考: https://qiita.com/nanin/items/54ece2a96f6634bcde5e

// 設定
const CONFIG = {
    VRM_FILE_URL: '/assets/vrm/6156990452426395380.vrm',
    VRMA_FILES: {
        'greeting': '/assets/vrma/VRMA_02.vrma',
        'v_sign': '/assets/vrma/VRMA_03.vrma',
        'show_body': '/assets/vrma/VRMA_01.vrma'
    }
};

// グローバル変数
let scene, camera, renderer, vrm, mixer, clock;
let isLoading = true;

// Three.js初期化
function initThreeJS() {
    console.log('Initializing Three.js...');
    
    // シーン作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x212121);
    
    // カメラ作成
    camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
    camera.position.set(0.0, 1.0, -5.0);
    
    // レンダラー作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // キャンバスをDOMに追加
    const canvas = document.getElementById('vrm-canvas');
    if (canvas) {
        canvas.appendChild(renderer.domElement);
    }
    
    // ライト設定
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // クロック作成
    clock = new THREE.Clock();
    
    console.log('Three.js initialized successfully');
}

// VRMローダー初期化
async function initVRMLoader() {
    console.log('Initializing VRM loader...');
    
    try {
        // GLTFローダー作成
        const loader = new THREE.GLTFLoader();
        
        // VRMローダープラグイン追加
        loader.register((parser) => {
            return new VRMLoaderPlugin(parser);
        });
        
        console.log('VRM loader initialized successfully');
        return loader;
    } catch (error) {
        console.error('VRM loader initialization failed:', error);
        throw error;
    }
}

// VRMモデル読み込み
async function loadVRMModel(loader) {
    console.log('Loading VRM model...');
    
    try {
        const gltf = await loader.loadAsync(CONFIG.VRM_FILE_URL);
        vrm = gltf.userData.vrm;
        
        if (vrm) {
            // モデルをシーンに追加
            scene.add(vrm.scene);
            
            // キャラクターを正面向きに設定（Y軸で180度回転）
            vrm.scene.rotation.y = Math.PI;
            
            // 自然なポーズに調整
            adjustNaturalPose(vrm);
            
            // アニメーションミキサー作成
            mixer = new THREE.AnimationMixer(vrm.scene);
            
            console.log('VRM model loaded successfully');
            return vrm;
        } else {
            throw new Error('VRM data not found in loaded file');
        }
    } catch (error) {
        console.error('VRM model loading failed:', error);
        throw error;
    }
}

// 自然なポーズに調整
function adjustNaturalPose(vrm) {
    if (!vrm.humanoid) return;
    
    try {
        // 左腕を自然に下げる
        const leftShoulder = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
        const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
        const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
        
        if (leftShoulder) leftShoulder.rotation.z = 0.1;
        if (leftUpperArm) leftUpperArm.rotation.z = 0.3;
        if (leftLowerArm) leftLowerArm.rotation.z = 0.2;
        
        // 右腕を自然に下げる
        const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
        const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
        const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
        
        if (rightShoulder) rightShoulder.rotation.z = -0.1;
        if (rightUpperArm) rightUpperArm.rotation.z = -0.3;
        if (rightLowerArm) rightLowerArm.rotation.z = -0.2;
        
        console.log('Natural pose applied');
    } catch (error) {
        console.warn('Could not apply natural pose:', error);
    }
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // VRMアップデート
    if (vrm) {
        vrm.update(deltaTime);
    }
    
    // アニメーションミキサーアップデート
    if (mixer) {
        mixer.update(deltaTime);
    }
    
    // レンダリング
    renderer.render(scene, camera);
}

// ウィンドウリサイズ対応
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ローディング表示制御
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    isLoading = false;
    console.log('Loading hidden');
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    isLoading = true;
}

// チャット機能
function initChatSystem() {
    const sendButton = document.querySelector('button');
    const messageInput = document.querySelector('input[placeholder="メッセージを入力..."]');
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
        console.log('Chat system initialized');
    }
}

function handleSendMessage() {
    const messageInput = document.querySelector('input[placeholder="メッセージを入力..."]');
    if (messageInput && messageInput.value.trim()) {
        const message = messageInput.value.trim();
        console.log('Sending message:', message);
        
        // メッセージをクリア
        messageInput.value = '';
        
        // VRMキャラクターに反応させる
        triggerCharacterResponse(message);
    }
}

function triggerCharacterResponse(message) {
    console.log('Character responding to:', message);
    
    // 簡単な感情判定
    let emotion = 'greeting';
    if (message.includes('こんにちは') || message.includes('はじめまして')) {
        emotion = 'greeting';
    } else if (message.includes('ピース') || message.includes('やったね')) {
        emotion = 'v_sign';
    } else if (message.includes('見せて') || message.includes('全身')) {
        emotion = 'show_body';
    }
    
    // アニメーション再生（シミュレーション）
    playAnimation(emotion);
}

function playAnimation(emotion) {
    console.log('Playing animation:', emotion);
    
    if (!vrm || !mixer) {
        console.log('VRM model or mixer not ready, skipping animation');
        return;
    }
    
    const vrmaUrl = CONFIG.VRMA_FILES[emotion];
    if (!vrmaUrl) {
        console.log('VRMA file not found for emotion:', emotion);
        return;
    }
    
    // 既存のアニメーションを停止
    mixer.stopAllAction();
    
    // VRMAファイルを読み込み
    loadVRMAAnimation(vrmaUrl);
}

// VRMAアニメーション読み込み（上下反転修正付き）
async function loadVRMAAnimation(vrmaUrl) {
    console.log('Loading VRMA animation:', vrmaUrl);
    
    try {
        const loader = new THREE.GLTFLoader();
        const gltf = await loader.loadAsync(vrmaUrl);
        
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('VRMA animation loaded, applying Y-axis correction...');
            
            // アニメーションの各トラックを修正
            gltf.animations.forEach(animation => {
                animation.tracks.forEach(track => {
                    // Y軸の位置データを反転修正
                    if (track.name.includes('.position') && track.name.includes('Y')) {
                        console.log('Correcting Y-axis position for track:', track.name);
                        for (let i = 0; i < track.values.length; i++) {
                            track.values[i] *= -1; // Y軸を反転
                        }
                    }
                    
                    // Y軸の回転データを反転修正
                    if (track.name.includes('.quaternion') && track.name.includes('Y')) {
                        console.log('Correcting Y-axis rotation for track:', track.name);
                        for (let i = 1; i < track.values.length; i += 4) { // quaternionのy成分
                            track.values[i] *= -1; // Y軸回転を反転
                        }
                    }
                });
            });
            
            // アニメーションを再生
            const action = mixer.clipAction(gltf.animations[0]);
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
            
            console.log('VRMA animation playing with Y-axis correction');
            
            // アニメーション終了後のコールバック
            action.getMixer().addEventListener('finished', () => {
                console.log('Animation finished');
                // 次のアイドルアニメーションをスケジュール
                scheduleIdleAnimation();
            });
            
        } else {
            console.warn('No animations found in VRMA file');
        }
        
    } catch (error) {
        console.error('VRMA animation loading failed:', error);
        // エラーの場合もアイドルアニメーションをスケジュール
        scheduleIdleAnimation();
    }
}

// アイドルアニメーションのスケジューリング
function scheduleIdleAnimation() {
    // 2-5秒後にランダムなアニメーションを再生
    const delay = Math.random() * 3000 + 2000; // 2000-5000ms
    setTimeout(() => {
        if (vrm && mixer) {
            const emotions = Object.keys(CONFIG.VRMA_FILES);
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            playAnimation(randomEmotion);
        }
    }, delay);
}

function animateCamera() {
    if (typeof TWEEN !== 'undefined') {
        const currentPos = camera.position.clone();
        const targetPos = new THREE.Vector3(
            currentPos.x + (Math.random() - 0.5) * 2,
            currentPos.y + (Math.random() - 0.5) * 0.5,
            currentPos.z
        );
        
        new TWEEN.Tween(currentPos)
            .to(targetPos, 2000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                camera.position.copy(currentPos);
                camera.lookAt(scene.position);
            })
            .start();
    }
}

// メイン初期化関数
async function init() {
    console.log('Starting VRM Chat App initialization...');
    
    try {
        // Three.js初期化
        initThreeJS();
        
        // VRMローダー初期化
        const loader = await initVRMLoader();
        
        // VRMモデル読み込み
        await loadVRMModel(loader);
        
        // チャットシステム初期化
        initChatSystem();
        
        // ウィンドウリサイズイベント
        window.addEventListener('resize', onWindowResize);
        
        // アニメーション開始
        animate();
        
        // アイドルアニメーション開始
        scheduleIdleAnimation();
        
        // ローディング非表示
        hideLoading();
        
        console.log('VRM Chat App initialized successfully!');
        
    } catch (error) {
        console.error('Initialization failed:', error);
        hideLoading();
        
        // エラー表示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = '<div style="color: #ff6b6b;">VRMキャラクターの読み込みに失敗しました</div>';
            loadingElement.style.display = 'flex';
        }
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    
    // 必要なライブラリが読み込まれているかチェック
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }
    
    if (typeof VRMLoaderPlugin === 'undefined') {
        console.error('VRM Loader Plugin not loaded');
        return;
    }
    
    // 初期化実行
    init();
});

// Tween.jsアップデート（利用可能な場合）
if (typeof TWEEN !== 'undefined') {
    function updateTween() {
        TWEEN.update();
        requestAnimationFrame(updateTween);
    }
    updateTween();
}

console.log('VRM Chat App script loaded');

