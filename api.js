var express = require('express');
const router = express.Router();
let common = require('./common');
var port = process.env.PORT || 3200;
var path    = require("path");
const multer = require("multer");
const fs = require("fs");
router.get('/', function(req, res) {

    return res.sendFile(path.join(__dirname+'/frontend/HTML/login.html'));
    
});

// default route
router.post('/registerApi', async(req, res)=>{
    let subject = req.body.subject;
    let type = req.body.regAs;
    var error_msg=``;
    var error= false;
    if(req.body.psw!=req.body.psw_repeat || req.body.psw=='')
    {
      error = true;
      error_msg+="Both Password Should Be same \n<br>";
    }else{
       pass = (req.body.psw_repeat).trim();
    
    }
    if((req.body.name)=='')
    {
      error = true;
      error_msg+="Name Should Not Blank \n<br>";
    }else{
      
       name = (req.body.name).trim();
    }
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if(req.body.email=='' || !emailRegexp.test(req.body.email))
    {
      error = true;
      error_msg+="Email Should Not Blank/Invalid \n<br>";
    }else{
       email = (req.body.email).trim();
    }
    console.log(subject);
    if(!subject)
    {
      error = true;
      error_msg+="Please Select Subject \n<br>";
    }else if(type==1 && subject.length >1)
    {
      error = true;
      error_msg+="Student Can Select Only One Subject \n<br>";
    }

   
    let check_user_query = `select * from user where status=1 and email='`+email+`';`;
    let record = await common.asyncConn(check_user_query);
    if(record.length > 0 )
    {
      error = true;
      error_msg+="Email Id Is allready Registered \n<br>";
      
    }
        let queryy = `select * from subject_details where status=1; `;
          let ress = await common.asyncConn(queryy);
       
    if(error==true)
    {
      return res.render(path.join(__dirname+'/frontend/HTML/signup.html'), {data:{subject:ress,error:error,error_msg:error_msg}});
        
    }
    let query = `insert into user(name,email, password,type, subject, status) values('`+name+`', '`+email+`', md5('`+pass+`'), `+type+`,'`+subject+`', 1); `;
    common.dbConn.query(query, async(insertion_err, insertion_result) => {
        if (insertion_err) {
          error = true;
          error_msg+="There were some issues while inserting the data \n<br>";
      
        }else{
                error= false;
                message= "Registred Successfully !!";
              
        }
        
           return res.render(path.join(__dirname+'/frontend/HTML/signup.html'), {data:{subject:ress,error:error,error_msg:error_msg}});
        
    });
});

router.post('/loginApi', (req, res)=>{

  let query = `select * from user where status=1 and email='`+req.body.email+`' and password=md5('`+req.body.password+`'); `;
  common.dbConn.query(query, async(err, result) => {
      if (err) {
        return res.send({
          error: true,
          message: "There were some issues while fetching the data",
        });
      }else{
        if(result.length >0 )
        {
          
          if(result[0].type==1)
          {
            return res.render(path.join(__dirname+'/frontend/HTML/studentDashboard.html'), {data:{result:result}});
        
          }else{
            let query = `select * from subject_details where status=1; `
            let ress = await common.asyncConn(query);
            return res.render(path.join(__dirname+'/frontend/HTML/instructorDashboard.html'), {data:{subject:ress,result:result}});
        
          }
          
        }else{
          return res.render(path.join(__dirname+'/frontend/HTML/login.html'), {data:{error:'Invalid Login'}});
        }
         
      }
  });
});

const assign_diskstorage = multer.diskStorage({
  destination: path.join(__dirname + "/uploadedfiles/assignments"),
  filename: async (req, file, callback) => {
    req.body.multer_status = 200;
    req.body.multer_error = false;
    req.body.multer_filename_status = file.originalname;
    req.body.multer_message = "Assignment uploaded successfully";
    let assignment_name =req.body.subject+"_" +Math.round(Date.now() / 1000, 0).toString() +"_"+file.originalname;
        callback(null, assignment_name);
    let fullpath = path.join(__dirname  + "/uploadedfiles/assignments/" + assignment_name);
    req.body.multer_fullpath = assignment_name;
    req.body.file_originalname = file.originalname;
    //comment this line to dump email verification process
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" 
  ) {
    req.body.multer_error = false;
    cb(null, true);
  } else {
    req.body.multer_error = true;
    req.body.multer_msg = 'File format should be pdf';
    cb("File format should be PNG,JPG,JPEG", false);
  }
};
var assignmentupload = multer({
  storage: assign_diskstorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024},
}).single("assignment");


router.post('/addAssignmentApi',assignmentupload, async(req, res)=>{
  if(req.body.multer_error==true)
  {
    return res.send({
      error:true,
      message:req.body.multer_msg,
      data:req.body
  });
  }else{
  
    let name = req.body.name;
    let subject = req.body.subject;
    let deadline = req.body.deadline;
    let question_file = (req.body.multer_fullpath);
    let instructor_id = req.body.instructor_id;
    let queryy = `select * from user where status=1 and id=`+req.body.instructor_id+`; `;
    let result = await common.asyncConn(queryy);
    let query = `insert into assignment(name, subject,question_file, instructor_id, deadline) values('`+name+`',`+subject+`, '`+question_file+`',`+instructor_id+`,unix_timestamp('`+deadline+`')); `;
    common.dbConn.query(query, async(insertion_err, insertion_result) => {
        if (insertion_err) {
          return res.send({
            error: true,
            message: "There were some issues while inserting the data"+insertion_err,
          });
        }else{
          let query = `select * from subject_details where status=1; `
            let ress = await common.asyncConn(query);
            return res.render(path.join(__dirname+'/frontend/HTML/instructorDashboard.html'), {data:{subject:ress,result:result,mesg:'Assignment Created  Successfully !!'}});
        
            // return res.send({
            //     error: false,
            //     message: "Assignment Created  Successfully !!",
            //   });
        }
    });
  
  
  }
})

router.post('/addSubmitAssignmentApi',assignmentupload, async(req, res)=>{
  if(req.body.multer_error==true)
  {
    return res.send({
      error:true,
      message:req.body.multer_msg,
      data:req.body
  });
  }else{
  
    let assignment_id = req.body.assignment_id;
    let student_id = req.body.student_id;
    let submited_file = (req.body.multer_fullpath);
    let query = `insert into submission(assignment_id, student_id,submited_file, submited_time) values(`+assignment_id+`,`+student_id+`, '`+submited_file+`',unix_timestamp(NOW())); `;
    console.log(query);
    common.dbConn.query(query, (insertion_err, insertion_result) => {
        if (insertion_err) {
          return res.send({
            error: true,
            message: "There were some issues while inserting the data"+insertion_err,
          });
        }else{
            return res.send({
                error: false,
                message: "Assignment Submited  Successfully !!",
              });
        }
    });
  
  
  }
})

router.post('/listSubmitedAssignmentApi', function(req, res) {

  let query = `Select a.question_file as assignment_file, s.submited_file as answer_file, u.name as student_name,sub.name as subject_name,a.name as assignment_name, from_unixtime(s.submited_time) as submited_time, a.id as assignment_id, s.id as submited_id from assignment as a left join submission as s on a.id=s.assignment_id left join user as u on u.id=s.student_id left join subject_details as sub on sub.id=a.subject where a.instructor_id=`+req.body.instructor_id+` order by s.submited_time DESC; `;
  common.dbConn.query(query, (err, result) => {
      if (err) {
        return res.send({
          error: true,
          message: "There were some issues while fetching the data",
        });
      }else{
          return res.send({
              error: false,
              message: "Fetch Successfully !!",
              data:result
            });
      }
  });
});


router.post('/listAssignmentApi', function(req, res) {

  let query = `select a.id, a.name,a.question_file,instructor_id, from_unixtime(a.deadline) as deadline, sub.name as subject from assignment as a left join subject_details as sub on sub.id=a.subject where a.instructor_id=`+req.body.instructor_id+` order by a.deadline DESC;`;
  common.dbConn.query(query, (err, result) => {
      if (err) {
        return res.send({
          error: true,
          message: "There were some issues while fetching the data",
        });
      }else{
          return res.send({
              error: false,
              message: "Fetch Successfully !!",
              data:result
            });
      }
  });
});

router.post('/listAssignmentforStudentApi', function(req, res) {

  let query = `select a.id, a.name,a.question_file,instructor_id, from_unixtime(a.deadline) as deadline, sub.name as subject from assignment as a left join subject_details as sub on sub.id=a.subject where a.subject=`+req.body.subject+` order by a.deadline DESC;`;
  common.dbConn.query(query, (err, result) => {
      if (err) {
        return res.send({
          error: true,
          message: "There were some issues while fetching the data",
        });
      }else{
          return res.send({
              error: false,
              message: "Fetch Successfully !!",
              data:result
            });
      }
  });
});

router.post('/listSubmmissionApi', function(req, res) {

  let query = `Select a.name as assignment_name,a.question_file, from_unixtime(a.deadline) as  deadline, u.name as instructor_name ,from_unixtime(s.submited_time) as s_time,  s.* from submission s left join assignment as a on s.assignment_id=a.id left join user as u on a.instructor_id=u.id where student_id=`+req.body.student_id+`;`;
  common.dbConn.query(query, (err, result) => {
      if (err) {
        return res.send({
          error: true,
          message: "There were some issues while fetching the data"+query,
        });
      }else{
          return res.send({
              error: false,
              message: "Fetch Successfully !!",
              data:result
            });
      }
  });
});

router.get('/subjectList', function(req, res) {

    let query = `select * from subject_details where status=1; `;
    common.dbConn.query(query, (err, result) => {
        if (err) {
          return res.send({
            error: true,
            message: "There were some issues while fetching the data",
          });
        }else{
            return res.send({
                error: false,
                message: "Registred Successfully !!",
                data:result
              });
        }
    });
});
router.get('/viewfile', function (req, res) {
  var filePath = "/uploadedfiles/assignments/"+req.query.fileName;

  fs.readFile(__dirname + filePath , function (err,data){
      res.contentType("application/pdf");
      res.send(data);
  });
});


module.exports = router;
