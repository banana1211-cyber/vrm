import axios from 'axios';

// にじボイス設定
const NIJIVOICE_CONFIG = {
    base_url: 'https://api.nijivoice.com/api/platform/v1',
    api_key: process.env.NIJIVOICE_API_KEY,
    character_id: process.env.NIJIVOICE_CHARACTER_ID
};

export default async function handler(req, res) {
    // 環境変数チェック
    if (!NIJIVOICE_CONFIG?.api_key || !NIJIVOICE_CONFIG?.character_id) {
        return res.status(500).json({
            success: false,
            error: 'にじボイスの環境変数が未設定です（NIJIVOICE_API_KEY / NIJIVOICE_CHARACTER_ID）'
        });
    }

    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { message, emotion = 'greeting' } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'メッセージが必要です'
            });
        }

        // にじボイスAPI呼び出し
        const response = await axios.post(
            `${NIJIVOICE_CONFIG.base_url}/voice-actors/${NIJIVOICE_CONFIG.character_id}/generate-voice`,
            {
                script: message,
                speed: '1.0',
                format: 'mp3'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': NIJIVOICE_CONFIG.api_key
                }
            }
        );

        if (response.data && response.data.audioUrl) {
            res.json({
                success: true,
                audio_url: response.data.audioUrl,
                message: message,
                emotion: emotion,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('音声URLが取得できませんでした');
        }

    } catch (error) {
        console.error('にじボイスAPI Error:', error);
        res.status(500).json({
            success: false,
            error: 'にじボイス音声合成でエラーが発生しました',
            details: error.message
        });
    }
}

