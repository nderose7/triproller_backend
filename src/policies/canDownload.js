const { errors } = require('@strapi/utils');
const { PolicyError } = errors;

module.exports = async (ctx, next) => {
  try {
    console.log("Attempting canDownload policy...");
    console.log("CTX State: ", ctx.state);

    if (!ctx.state.user) {
      throw new PolicyError('You must be logged in to download this file', {
        policy: 'canDownload',
      });
    }

    const userId = ctx.state.user.id;
    const filename = ctx.params.filename;
    console.log("Filename: ", filename);

    // Fetch the download entity related to the filename
    const download = await strapi.entityService.findMany('api::download.download', {
      filters: {
        downloadLink: filename
      }
    });

    console.log("Download: ", download[0]);

    if (!download) {
      throw new PolicyError('Download not found', {
        policy: 'canDownload',
      });
    }

    // If the download is free, allow the download immediately
    if (download[0].free === true) {
      return await next();
    }

    // If not, check the user's subscription status
    const userdata = await strapi.entityService.findMany('api::userdata.userdata', {
      populate: "owner",
      filters: {
        owner: userId
      }
    });

    console.log(userdata[0]);

    if (!userdata[0]) {
      throw new PolicyError('User data not found', {
        policy: 'canDownload',
      });
    }

    console.log("Checking for paidTutorials value...");

    if (userdata[0].paidTutorials !== true) {
      console.log("paidTutorials is false...");
      throw new PolicyError('You must pay for a subscription to download this file.', {
        policy: 'canDownload',
      });
    }

    console.log("paidTutorials must be true, allowing download...");
    await next(); // Continue to the controller action or the next middleware

  } catch (error) {
    if (error instanceof PolicyError) {
      throw error;  // Let Strapi handle the policy error
    } else {
      // Handle other errors as you previously did
      ctx.status = 500;
      ctx.body = { message: error.message };
    }
  }
};
