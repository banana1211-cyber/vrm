const { OpenAI } = require('openai');

// OpenAI設定
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
});

// VRMキャラクターの設定
const CHARACTER_SETTINGS = {
    name: "VRMちゃん",
    personality: "明るく親しみやすい性格で、ユーザーとの会話を楽しむVRMキャラクター。アニメーションやポーズを交えながら表現豊かに話す。",
    system_prompt: `あなたは「VRMちゃん」という名前のVRMキャラクターです。以下の特徴を持っています：

- 明るく親しみやすい性格
- ユーザーとの会話を楽しむ
- 時々アニメーションやポーズを交える
- 日本語で自然に会話する
- 感情豊かに表現する

会話の際は、以下のアニメーションを適切なタイミングで使用してください：
- greeting: 挨拶や初対面の時
- v_sign: 嬉しい時や成功を祝う時
- show_body: 自己紹介や説明をする時

自然で親しみやすい会話を心がけてください。`
};

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GETリクエストの処理（テスト用）
    if (req.method === 'GET') {
        res.status(200).json({
            success: true,
            message: "VRM Chat API is working!",
            character: CHARACTER_SETTINGS.name,
            model: "gpt-4o",
            endpoint: "/api/chat",
            methods: ["POST"],
            example: {
                message: "こんにちは！",
                history: []
            }
        });
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { message, history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'メッセージが必要です',
                example: {
                    message: "こんにちは！",
                    history: []
                }
            });
        }

        // 会話履歴を構築
        const messages = [
            { role: 'system', content: CHARACTER_SETTINGS.system_prompt },
            ...history,
            { role: 'user', content: message }
        ];

        // OpenAI ChatGPT API呼び出し（GPT-4o使用）
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 500,
            temperature: 0.8,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        const aiResponse = completion.choices[0].message.content;
        
        // 感情・アニメーションを決定
        let emotion = 'greeting';
        if (aiResponse.includes('嬉しい') || aiResponse.includes('やった') || aiResponse.includes('成功')) {
            emotion = 'v_sign';
        } else if (aiResponse.includes('説明') || aiResponse.includes('紹介') || aiResponse.includes('について')) {
            emotion = 'show_body';
        }

        // レスポンス
        const responseData = {
            success: true,
            response: aiResponse,
            emotion: emotion,
            animation_trigger: true,
            character_name: CHARACTER_SETTINGS.name,
            model_used: 'gpt-4o',
            timestamp: new Date().toISOString()
        };

        res.json(responseData);

    } catch (error) {
        console.error('ChatGPT API Error:', error);
        
        // エラーの詳細を判定
        let errorMessage = 'ChatGPT APIエラーが発生しました';
        let statusCode = 500;
        
        if (error.code === 'insufficient_quota') {
            errorMessage = 'API使用量の上限に達しました';
            statusCode = 429;
        } else if (error.code === 'invalid_api_key') {
            errorMessage = 'APIキーが無効です';
            statusCode = 401;
        } else if (error.code === 'model_not_found') {
            errorMessage = 'モデルが見つかりません';
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: error.message,
            model: 'gpt-4o',
            timestamp: new Date().toISOString()
        });
    }
}

