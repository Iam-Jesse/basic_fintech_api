const jwt = require('jsonwebtoken');

module.exports = { 
  verifyToken: async (req, res, next) => {    
    try{
      let token = req.header('Authorization');
    
      if (!token)
      return res.json({ error: 'No token provided.' });
      
      if(token.split(' ')[0] === 'Bearer'){
        let verification = await jwt.verify(token.split(' ')[1], process.env.TOKEN_SECRET);

        if(verification.id !== ''){
          res.locals.user = verification;
          next();
        }else{
          return res.json({error: 'Something went wrong!'});
        }
      }
    }catch{
      return res.json({error: 'Something went wrong!'});
    }
  },
  
  validationErrors: (allErrors, res) => {
    if (!allErrors.isEmpty()) {
      let errorMessages = [];
      allErrors.errors.forEach(msgObject => {
        errorMessages.push(msgObject.msg);
      });
      res.json({error: errorMessages});
      return true;
    }
  }
};