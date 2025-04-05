const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();
const port = 3000;

const corsOptions = {
    origin: 'http://food-rating-experiment-2765-6919-9214.s3-website-us-east-1.amazonaws.com',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Backend is running');
});

AWS.config.update({ region: 'us-east-1' });
const ssm = new AWS.SSM();
const s3 = new AWS.S3();

async function getS3BucketName() {
    console.log('Fetching S3 bucket name from SSM...');
    const params = {
        Name: '/food-rating/s3-bucket',
        WithDecryption: true
    };
    try {
        const result = await ssm.getParameter(params).promise();
        console.log('SSM result:', result);
        return result.Parameter.Value;
    } catch (err) {
        console.error('SSM error:', err);
        throw err;
    }
}

app.post('/save-data', async (req, res) => {
    console.log('Received /save-data request');
    try {
        const data = req.body;
        console.log('Request body received:', JSON.stringify(data).slice(0, 100) + '...');
        const timestamp = new Date().toISOString();
        const fileName = `experiment-data-${timestamp}.json`;
        
        const bucketName = await getS3BucketName();
        console.log('Using bucket:', bucketName);

        const s3Params = {
            Bucket: bucketName,
            Key: fileName,
            Body: JSON.stringify(data, null, 2),
            ContentType: 'application/json'
        };

        console.log('Uploading to S3...');
        await s3.upload(s3Params).promise();
        console.log(`Uploaded ${fileName} to ${bucketName}`);
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (err) {
        console.error('Error in /save-data:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to save data', details: err.message });
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});