// GPTs連携用VRMキャラクターチャットAPI
export default async function handler(req, res) {
    // CORS設定（GPTsからのアクセスを許可）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // POST以外のメソッドを拒否
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST method.'
        });
    }

    try {
        const { 
            message, 
            character_name = "VRMちゃん",
            emotion = "greeting",
            api_key 
        } = req.body;

        // 基本的なバリデーション
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
                example: {
                    message: "こんにちは！",
                    character_name: "VRMちゃん",
                    emotion: "greeting"
                }
            });
        }

        // API Key検証（オプション）
        const VALID_API_KEY = process.env.GPTS_API_KEY || 'vrm-chat-2024';
        if (api_key && api_key !== VALID_API_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        // 利用可能なアニメーション一覧
        const AVAILABLE_ANIMATIONS = {
            'greeting': '挨拶・初対面',
            'v_sign': '嬉しい・成功',
            'show_body': '自己紹介・説明'
        };

        // 感情からアニメーションを決定
        let animation = emotion;
        if (!AVAILABLE_ANIMATIONS[emotion]) {
            animation = 'greeting'; // デフォルト
        }

        // VRMキャラクターへのメッセージ送信をシミュレート
        const response_message = `${character_name}が「${message}」というメッセージを受け取りました。`;

        // GPTs向けのレスポンス
        const response_data = {
            success: true,
            data: {
                character_name: character_name,
                received_message: message,
                response: response_message,
                animation: animation,
                animation_description: AVAILABLE_ANIMATIONS[animation],
                timestamp: new Date().toISOString(),
                status: "Message sent to VRM character successfully"
            },
            meta: {
                api_version: "1.0",
                endpoint: "/api/gpts-chat",
                available_animations: AVAILABLE_ANIMATIONS
            }
        };

        // 成功レスポンス
        res.status(200).json(response_data);

    } catch (error) {
        console.error('GPTs Chat API Error:', error);
        
        // エラーレスポンス
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'VRMキャラクターとの通信でエラーが発生しました',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

