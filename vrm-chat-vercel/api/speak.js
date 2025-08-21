const axios = require('axios');

// にじボイスAPI設定
const NIJIVOICE_CONFIG = {
    base_url: 'https://api.nijivoice.com/api/platform/v1',
    api_key: process.env.NIJIVOICE_API_KEY || '7e550c85-7d55-454e-a2ac-16816de71315',
    character_id: process.env.NIJIVOICE_CHARACTER_ID || '8c08fd5b-b3eb-4294-b102-a1da00f09c72'
};

// 感情別音声パラメータ
const emotionVoiceMap = {
    'greeting': { speed: '1.0', emotionalLevel: '0.3', soundDuration: '0.2' },
    'v_sign': { speed: '1.2', emotionalLevel: '0.8', soundDuration: '0.3' },
    'show_body': { speed: '1.0', emotionalLevel: '0.2', soundDuration: '0.1' },
    'model_pose': { speed: '0.9', emotionalLevel: '0.4', soundDuration: '0.2' },
    'exercise': { speed: '1.3', emotionalLevel: '0.6', soundDuration: '0.2' },
    'rotate': { speed: '1.1', emotionalLevel: '0.5', soundDuration: '0.1' },
    'shoot': { speed: '1.0', emotionalLevel: '0.7', soundDuration: '0.2' }
};

// にじボイスAPI呼び出し関数
async function callNijivoiceAPI(text, voiceParams) {
    try {
        const response = await axios.post(
            `${NIJIVOICE_CONFIG.base_url}/voice-actors/${NIJIVOICE_CONFIG.character_id}/generate-voice`,
            {
                script: text,
                speed: voiceParams.speed,
                emotionalLevel: voiceParams.emotionalLevel,
                soundDuration: voiceParams.soundDuration,
                format: 'mp3'
            },
            {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': NIJIVOICE_CONFIG.api_key,
                    'content-type': 'application/json'
                }
            }
        );

        return {
            audio_url: response.data.audioFileUrl || response.data.url,
            success: true
        };
    } catch (error) {
        console.error('にじボイスAPI Error:', error.response?.data || error.message);
        throw new Error('音声生成に失敗しました');
    }
}

export default async function handler(req, res) {
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
        const { message, emotion } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'メッセージが必要です'
            });
        }

        // 感情パラメータの取得
        const voiceParams = emotionVoiceMap[emotion] || emotionVoiceMap['greeting'];
        
        // にじボイスAPI呼び出し
        const nijivoiceResponse = await callNijivoiceAPI(message, voiceParams);
        
        // レスポンス
        res.json({
            success: true,
            message: 'キャラクターが発話しました',
            emotion: emotion || 'greeting',
            timestamp: new Date().toISOString(),
            audio_url: nijivoiceResponse.audio_url
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました',
            details: error.message
        });
    }
}

