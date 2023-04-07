var AWS = require('aws-sdk');
var sessionAws = {
    instance: null,
    credentials: null,
}

function GetAwsCredentials() {
    if (process.env.AWS_ACCESS_KEY != null)
        return {
            AwsAccessKey: process.env.AWS_ACCESS_KEY,
            AwsSecretKey: process.env.AWS_SECRET_KEY,
            AwsRegion: process.env.AWS_REGION,
            AwsBucket: process.env.AWS_BUCKET,
            AwsS3ApiVersion: '2006-03-01',
        }
    else
        return sessionAws.credentials;
}

function GetS3Instance() {
    if (sessionAws.instance == null) {
        sessionAws.credentials = GetAwsCredentials();
        AWS.config.update({
            accessKeyId: sessionAws.credentials.AwsAccessKey,
            secretAccessKey: sessionAws.credentials.AwsSecretKey,
            region: sessionAws.credentials.AwsRegion
        });
        sessionAws.instance = new AWS.S3({ apiVersion: sessionAws.credentials.AwsS3ApiVersion });
    }
    return sessionAws.instance;
}

module.exports = {
    credentials: sessionAws.credentials,
    SetSession: function (session) {
        sessionAws.credentials = session.credentials;
        GetS3Instance();
    },
    DestroySession: function () {
        sessionAws.credentials = null;
        sessionAws.instance = null;
    },
    validconfig: async function () {
        s3 = GetS3Instance();
        try {
            await s3.headBucket({ Bucket: sessionAws.credentials.AwsBucket }).promise();
            return true;
        }
        catch { return false; }
    },
    objects: async function (path) {
        s3 = GetS3Instance();

        let prefix = path ? path + '/' : '';
        var bucketParams = {
            Bucket: sessionAws.credentials.AwsBucket,
            Delimiter: '/',
            Prefix: prefix,
        };

        const resp = [];
        let json;
        try {
            do {
                json = await s3.listObjectsV2(bucketParams).promise();
                if (json)
                    resp.push(json);

                if (json['IsTruncated'])
                    bucketParams.ContinuationToken = json['NextContinuationToken'];
            } while (json['NextContinuationToken']);

            return resp;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    folders: async function (path) {
        let json = await this.objects(path, 'CommonPrefixes');
        return json;
    },

    datalogs: async function (path) {
        let json = await this.objects(path, 'Contents');
        return json;
    },

    getfile: async function (path) {
        s3 = GetS3Instance();

        var bucketParams = {
            Bucket: sessionAws.credentials.AwsBucket,
            Key: path,
        };

        if (response = await s3.getObject(bucketParams).promise().catch(err => { return null; }))
            return response.Body.toString();
        else
            return null;
    },

    downloadfile: async function (path, res) {
        s3 = GetS3Instance();

        var bucketParams = {
            Bucket: sessionAws.credentials.AwsBucket,
            Key: path,
        };

        res.attachment(path);
        var fileStream = s3.getObject(bucketParams).createReadStream();
        fileStream.pipe(res);
    },

    objectexists: async function (path) {
        s3 = GetS3Instance();

        var bucketParams = {
            Bucket: sessionAws.credentials.AwsBucket,
            Key: path,
        };

        try {
            await s3.headObject(bucketParams).promise();
            const signedUrl = s3.getSignedUrl('getObject', bucketParams);

            return true;
        } catch (error) {
            return false;
        }
    },

    upload: async function (path, stream) {
        s3 = GetS3Instance();

        var bucketParams = {
            Bucket: sessionAws.credentials.AwsBucket,
            Key: path,
            Body: stream
        };
        await s3.upload(bucketParams).promise();
    },
}
