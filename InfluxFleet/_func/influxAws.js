var init = require("../_func/initialization.js");
var AWS = require('aws-sdk');
var _mainS3 = null;

function GetS3Instance() {
    if (_mainS3 == null) {
        AWS.config.update({ accessKeyId: init.AwsAccessKey, secretAccessKey: init.AwsSecretKey, region: init.AwsRegion });
        _mainS3 = new AWS.S3({ apiVersion: init.AwsS3ApiVersion });
    }
    return _mainS3;
}

module.exports = {

    objects: async function (path) {
        s3 = GetS3Instance();

        let prefix = path ? path + '/' : '';
        var bucketParams = {
            Bucket: init.AwsBucket,
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
            Bucket: init.AwsBucket,
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
            Bucket: init.AwsBucket,
            Key: path,
        };

        res.attachment(path);
        var fileStream = s3.getObject(bucketParams).createReadStream();
        fileStream.pipe(res);
    },

    objectexists: async function (path) {
        s3 = GetS3Instance();

        var bucketParams = {
            Bucket: init.AwsBucket,
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
            Bucket: init.AwsBucket,
            Key: path,
            Body: stream
        };
        await s3.upload(bucketParams).promise();
    },
}
