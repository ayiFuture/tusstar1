var fs = require('fs') //文件操作库
var path = require('path') //地址操作库
var http = require('http'); //http服务库
var Config = require('./conf/conf') //自己写的配置信息文件
var ContentType = require('./lib/contenttype') //自己写的contenttype获取库
var log = require('./utils/log') //自己写的日志出库输
var mysql = require('mysql')
var express = require('express')
var session = require('express-session')
var bodyparser = require('body-parser')
var multer = require('multer');
var app = express()
app.use(session({
    secret: "session",
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60,
    },
}));

var pool = mysql.createPool({
    host: '121.40.183.204',
    user: 'tusstar',
    password: 'TusstarDB@123',
    port: '3306',
    database: 'TusstarDB'
});

var query = function (sql, options, callback) {

    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, options, function (err, results, fields) {
                //事件驱动回调
                callback(err, results, fields);
            });
            //释放连接，需要注意的是连接释放需要在此处释放，而不是在查询回调里面释放
            conn.release();
        }
    });
};

app.use(multer({ dest: '/tmp/' }).array('image')); 02
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))
app.use('/upload', function (request, response) {
    console.log("1")
    var des_file = __dirname + path.sep + "upload" + path.sep + request.files[0].originalname;
    fs.readFile(request.files[0].path, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            fs.writeFile(des_file, data, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    response.end("上传成功")
                    console.log(des_file)
                    var imginsert = "insert into img (phone,imgadress) value (?,?)"
                    var imgParam = [request.files[0].originalname, des_file]
                    query(imginsert, imgParam, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
            })
        }
    });
})
app.use('/users', function (request, response) {
    if (request.body.code == '1001') {//用户注册
        var CheckAddSql = "select * from users where phone = " + " '" + request.body.phone + "' "
        query(CheckAddSql, function (err, result) {
            console.log(result.length)
            if (err) {
                console.log('[select-error] - ' + err.message);
                response.end('error');
                return
            }
            if (result.length != 0) {
                response.end('errortypeone')
                console.log('error-' + '已有用户')
                return
            }
            if (result.length == 0) {
                var addSql = "insert into users (phone,name,email,sex,password,isadmin,status) value (?,?,?,?,?,?,?) "
                var addSqlParams = [request.body.phone, request.body.username, request.body.email, request.body.sex, request.body.password, request.body.isadmin, 0]
                query(addSql, addSqlParams, function (err, result) {
                    if (err) {
                        console.log(' error- ' + err.message)
                        response.end('error')
                        return
                    }
                    else {
                        response.end('success')
                        return
                    }
                })
            }
        })
    }
    else if (request.body.code == "1002") {//用户申请
        console.log(request.body)
        phone = request.session.phone
        name = request.session.username
        if (request.session.studentisadmin == 0) {
            var selectifresume = "select * from resume where phone = " + "'" + phone + "'"
            query(selectifresume, function (err, result) {
                if (err) {
                    console.log(' error- ' + err.message)
                    response.end('error')
                    return
                }
                else if (result == 0) {
                    response.end("noresume")
                    return
                }
                else {
                    var selectjoblist = "select * from joblist where phone = " + "'" + phone + "'" + "and companyname = " + "'" + request.body.companyname + "'"
                    query(selectjoblist, function (err, result) {
                        if (err) {
                            console.log(' error- ' + err.message)
                            response.end('error')
                            return
                        }
                        else if (result != 0) {
                            response.end('noagain')
                            return
                        }
                        else {
                            var insertjoblist = "insert into joblist (phone,name,company,companyname, restatus,Date) value (?,?,?,?,?,sysdate())"
                            var insertjoblistParams = [phone, name, request.body.company, request.body.companyname, 0]
                            query(insertjoblist, insertjoblistParams, function (err, result) {
                                if (err) {
                                    console.log(' error- ' + err.message)
                                    response.end('error')
                                    return
                                }
                                else {
                                    response.end("success")
                                    return
                                }
                            })
                        }
                    })
                }
            })
        }
        else {
            response.end("notstudent")
        }
    }
    else if (request.body.code == "1003") {//新建个人简历信息
        console.log(request.body);
        var checkresumesql = "select * from resume where phone = '" + request.body.phone + "'"
        query(checkresumesql, function (err, result) {
            console.log(result.length)
            if (err) {
                log.err('[error]-' + error)
                response.end('error')
                return
            }
            else if (result.length != 0) {
                response.end('errortypeone')
                return
            }
            else if (result.length == 0) {
                var addResumesql = "insert into resume (name,school,education,birthday,sex,selfintro,adress,phone,email,department,major,degree,system1,information,money,information2,nationality,entrance1) value (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
                var addResumeParam = [request.body.name, request.body.school, request.body.education, request.body.birthday, request.body.sex, request.body.selfintro, request.body.adress, request.body.phone, request.body.email, request.body.department, request.body.major, request.body.degree, request.body.system, request.body.information, request.body.money, request.body.information2, request.body.nationality, request.body.entrance]
                query(addResumesql, addResumeParam, function (err, result) {
                    if (err) {
                        response.end("error")
                        console.log("error-" + err.message)
                        return
                    }
                    else {
                        response.end("success")
                        return
                    }
                })
            }
        })
    }
    else if (request.body.code == "1004") {//判断登录，重置seesion
        var checkuser = "select * from users where phone = '" + request.body.phone + "'"
        query(checkuser, function (err, result) {
            if (err) {
                log.err('[error]-' + error)
                response.end('error')
                return
            }
            else if (result == 0) {
                response.end('errortypeone')
                return
            }
            else if (result != 0) {
                var selectpasswd = "select * from users where phone = '" + request.body.phone + "'"
                query(selectpasswd, function (err, result) {
                    if (err) {
                        log.err('[error]-' + error)
                        response.end('error')
                        return
                    }
                    else if (request.body.password == result[0].password) {
                        request.session.phone = result[0].phone//手机号
                        request.session.username = result[0].name//姓名
                        request.session.studentisadmin = result[0].isadmin//身份，0为用户，1位管理员，2为企业
                        if (request.session.studentisadmin == 1) {
                            response.end("admin")
                            return
                        }
                        else if (request.session.studentisadmin == 2) {
                            response.end("company")
                        }
                        else {
                            response.end("success")
                            return
                        }
                    }
                    else if (request.body.password != result[0].password) {
                        response.end("errortypetwo")
                        return
                    }
                })
            }
        })

    }
    else if (request.body.code == "1005") {//前端传送名字
        if (request.session.username == undefined || request.session.username == "") {
            response.end("nouser")
            console.log("no")
            return
        }
        else {
            response.end(JSON.stringify(request.session))
        }
    }
    else if (request.body.code == "1006") {//前端传送名字
        if (request.session.username == undefined || request.session.username == "") {
            response.end("nouser")
            console.log("no")
            return
        }
        else {
            response.end(JSON.stringify(request.session))
        }
    }
})
app.use('/bussiness', function (request, response) {
    if (request.body.code == '1001') {//发布工作
        var addjob = "insert into job (companyname,worktype,type,place,company,money,edubackground,workyear,email,phone,detail2,detail3,welfare,contact) value (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        var addjobParam = [request.body.companyname, request.body.worktype, request.body.type, request.body.place, request.session.phone, request.body.money, request.body.edubackground, request.body.workyear, request.body.email, request.body.phone, request.body.detail2, request.body.detail3, request.body.welfare, request.body.contact]
        query(addjob, addjobParam, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
                return
            }
            else {
                response.end("success")
                return
            }
        })
    }
    if (request.body.code == "1002") {//用户企业留言
        var addadvice = "insert into advice (name,email,maintitle,message) value (?,?,?,?)"
        var addadviceParam = [request.body.name, request.body.email, request.body.maintitle, request.body.message]
        query(addadvice, addadviceParam, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
                return
            }
            else {
                response.end("success")
                return
            }
        })
    }
    if (request.body.code == "1003") {//企业描述
        if (request.session.username == undefined || request.session.username == "") {
            response.send("errortypenouser")
            return
        }
        var selectjob = "select * from job where companyname = ?;"
        query(selectjob, request.body.name, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
                return
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })

    }
    if (request.body.code == "1004") {//岗位列表
        var selectjoblist = "select * from job"
        query(selectjoblist, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })
    }
    if (request.body.code == "1005") {//应聘者列表
        if (request.session.username == undefined || request.session.username == "") {
            response.send("errortypenouser")
            return
        }
        else if (request.session.studentisadmin != 2) {
            response.send("errortypenocompany")
            return
        }
        var selectuserlist = "select phone,companyname from joblist where company = " + "'" + request.session.phone + "'"
        query(selectuserlist, request.body.companyname, function (err, result) {
            if (err) {
                response.send("error")
                console.log("error-" + err.message)
                return
            }
            else if (result == 0) {
                response.end(JSON.stringify(result))
                return
            }
            else {
                var infores = result
                var selectuserinfo = "select * from resume where phone ="
                for (var i = 0; i < result.length - 1; i++) {
                    selectuserinfo = selectuserinfo + "'" + result[i].phone + "'" + " " + 'or' + " phone = "
                }
                selectuserinfo = selectuserinfo + "'" + result[result.length - 1].phone + "'"
                query(selectuserinfo, function (err, result) {
                    if (err) {
                        console.log("error" + err.message)
                        response.send("error")
                        return
                    }
                    else {
                        var finalinfo = new Array
                        for (var i = 0; i < result.length; i++) {
                            var temp = {
                                phone: result[i].phone,
                                name: result[i].name,
                                school: result[i].school,
                                education: result[i].education,
                                birthday: result[i].birthday,
                                sex: result[i].sex,
                                marriage: result[i].marriage,
                                adress: result[i].adress,
                                email: result[i].email,
                                department: result[i].department,
                                major: result[i].major,
                                degree: result[i].degree,
                                system1: result[i].system1,
                                information: result[i].information,
                                money: result[i].money,
                                information2: result[i].information2,
                                companyname: infores[i].companyname,
                            }
                            finalinfo.push(temp)
                        }
                        response.send(JSON.stringify(finalinfo))
                        return
                    }
                })
            }
        })
    }
    else if (request.body.code == "1006") {//应聘者信息
        console.log(request.body)
        var selectuserinfo = "select * from resume where phone = " + " '" + request.body.phone + "'"
        console.log(selectuserinfo)
        query(selectuserinfo, function (err, result) {
            if (err) {
                response.send("error")
                console.log("error-" + err.message)
            }
            else {
                console.log(result)
                response.send(JSON.stringify(result))
            }
        })
    }
    else if (request.body.code == "1007") {//发布简历判定
        if (request.session.username == undefined || request.session.username == "") {
            response.end("errortypenouser")
            return
        }
        else if (request.session.studentisadmin != '2') {
            response.end("notcompany")
            return
        }
    }
    else if (request.body.code == "1008") {//企业注册
        console.log(request.body);
        var CheckAddSql = "select * from companyusers where phone = " + " '" + request.body.phone + "' "
        query(CheckAddSql, function (err, result) {
            console.log(result.length)
            if (err) {
                console.log('[select-error] - ' + err.message);
                response.end('error');
                return
            }
            if (result.length != 0) {
                response.end('errortypeone')
                console.log('error-' + '已有用户')
                return
            }
            if (result.length == 0) {
                var CheckAddSql = "select * from users where phone = " + " '" + request.body.phone + "' "
                query(CheckAddSql, function (err, result) {
                    console.log(result.length)
                    if (err) {
                        console.log('[select-error] - ' + err.message);
                        response.end('error');
                        return
                    }
                    if (result.length != 0) {
                        response.end('errortypeone')
                        console.log('error-' + '已有用户')
                        return
                    }
                    if (result.length == 0) {
                        var addSql = "insert into companyusers (phone,username,companynature,companysize,place,fund,companytype,personphone,email,simpletro,introduce,password,listed,website,headquarters) value (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
                        var addSqlParams = [request.body.phone, request.body.username, request.body.companynature, request.body.companysize, request.body.place, request.body.fund, request.body.companytype, request.body.personphone, request.body.email, request.body.simpletro, request.body.introduce, request.body.password, request.body.listed, request.body.website, request.body.headquarters]
                        query(addSql, addSqlParams, function (err, result) {
                            if (err) {
                                console.log(' error- ' + err.message)
                                response.end('error')
                                return
                            }
                            else {
                                response.end('success')
                                var adduserssql = "insert into users (phone,name,email,sex,password,isadmin) value (?,?,?,?,?,?)"
                                adduserssqlParams = [request.body.phone, request.body.username, request.body.email, "无", request.body.password, "2"]
                                query(adduserssql, adduserssqlParams, function (err, result) {
                                    if (err) {
                                        console.log(' error- ' + err.message)
                                        response.end('error')
                                        return
                                    }
                                    else {
                                        console.log('insert sucess')
                                        return
                                    }
                                })
                                return
                            }
                        })
                    }
                })
            }
        })
    }
    else if (request.body.code == "1009") {//企业信息
        var selectjoblist = "select * from companyusers where phone = " + " '" + request.body.phone + "' "
        query(selectjoblist, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })

    }
    else if (request.body.code == "1010") {//企业列表
        var selectjoblist = "select * from companyusers"
        query(selectjoblist, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })
    }
    else if (request.body.code == "1011") {//job-detil中的企业列表
        var selectjoblist = "select * from job where company = " + " '" + request.body.phone + "' "
        query(selectjoblist, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })
    }
    else if (request.body.code == "1012") {//job-detil中的发布岗位数
        var selectjobnum = "select * from job where company = " + " '" + request.body.phone + "' "
        query(selectjobnum, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result.length))
                return
            }
        })
    }
    else if (request.body.code == "1013") {//job-detil中的简历投递数
        var selectjobnum = "select * from joblist where company = " + " '" + request.body.phone + "' "
        query(selectjobnum, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result.length))
                return
            }
        })
    }
    else if (request.body.code == "1014") {//完善简历信息判定
        if (request.session.username == undefined || request.session.username == "") {
            response.end("errortypenouser")
            return
        }
        else if (request.session.studentisadmin != '0') {
            response.end("notstudet")
            return
        }
    }
    else if (request.body.code == "1015") {//查询各类数值index页面
        var selectcompanynum = "select * from companyusers "
        query(selectcompanynum, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                console.log(JSON.stringify(result.length))
                response.end(JSON.stringify(result.length))
                return
            }
        })
    }
    else if (request.body.code == "1016") {//搜索
        var selectcompanynum = "select * from job where "
        var mid = ""
        if (request.body.mingcheng != "" && request.body.mingcheng != undefined) {
            selectcompanynum = selectcompanynum + "companyname = " + "'" + request.body.mingcheng + "'"
            mid = "1"
        }
        if (request.body.didian != "" && request.body.didian != undefined) {
            if (mid == "1") {
                selectcompanynum = selectcompanynum + " and place = " + "'" + request.body.didian + "'"
                mid = "2"
            }
            else if (mid == "") {
                selectcompanynum = selectcompanynum + "place = " + "'" + request.body.didian + "'"
                mid = "2"
            }
        }
        if (request.body.fenlei != "" && request.body.fenlei != undefined) {
            if (mid != "") {
                selectcompanynum = selectcompanynum + " and type = " + "'" + request.body.fenlei + "'"
            }
            else if (mid == "") {
                selectcompanynum = selectcompanynum + "type = " + "'" + request.body.fenlei + "'"
            }
        }
        query(selectcompanynum, function (err, result) {
            if (err) {
                response.end("error")
                console.log("error-" + err.message)
            }
            else {
                response.end(JSON.stringify(result))
                return
            }
        })
    }
})



app.use('/center', function (request, response) {
    var reslist = new Array();
    if (request.session.phone == null) {
        return
    }
    if (request.body.code == "1001") {//个人中心
        var selectstuInfo = "select name,phone, email,status from users where phone = " + "'" + request.session.phone + "'"
        query(selectstuInfo, function (err, result) {
            if (err) {
                response.send("error")
                console.log("error-" + err.message)
                return
            } else {
                switch (result[0].status) {
                    case 0:
                        result[0].status = "简历投递中"
                        break;
                    case 1:
                        result[0].status = "实习中"
                        break;
                    case 2:
                        result[0].status = "实习已结束"
                        break;
                    default:
                        console.log('vaild status')
                }
                reslist.push(result[0])
                console.log(reslist)
            }
        })
        var resumelist = "select j.company, j.companyname, j.restatus ,c.place from joblist j, companyusers c where j.phone=" + "'" + request.session.phone + "'" + "and j.company = c.phone"
        query(resumelist, function (err, result) {
            if (err) {
                response.send("error")
                console.log("error-" + err.message)
                return
            } else {
                for (let i = 0; i < result.length; i++) {
                    switch (result[i].restatus) {
                        case 0:
                            result[i].restatus = "已投递"
                            break;
                        case 1:
                            result[i].restatus = "被拒"
                            break;
                        case 2:
                            result[i].restatus = "等待面试"
                            break;
                        case 3:
                            result[i].restatus = "通过面试"
                            break;
                        case 4:
                            result[i].restatus = "已报到"
                            break;
                        default:
                            console.log('vaild status')
                    }
                }

                reslist.push(result)
                console.log(reslist)
                response.send(JSON.stringify(reslist))
                return
            }
        })
    } else if (request.body.code == "1002") {//完善简历
        if (request.body.name == null) {
            var resumeInfo = "select * from resume where phone = " + "'" + request.session.phone + "'"
            query(resumeInfo, function (err, result) {
                if (err) {
                    response.send("error")
                    console.log("error-" + err.message)
                    return;
                } else if (result.length == 0) {
                    response.send(JSON.stringify('EmptyResume'))
                    return;
                } else {
                    response.send(JSON.stringify(result))
                    return;
                }
            })
        } else {
            var Resumesql = "update resume set name=?,school=?,education=?,birthday=?,sex=?,selfintro=?,adress=?,email=?,department=?,major=?,degree=?,system1=?,information=?,money=?,information2=? where phone= " + "'" + request.session.phone + "'"
            var ResumeParam = [request.body.name, request.body.school, request.body.education, request.body.birthday, request.body.sex, request.body.selfintro, request.body.adress, request.body.email, request.body.department, request.body.major, request.body.degree, request.body.system1, request.body.information, request.body.money, request.body.information2]
            query(Resumesql, ResumeParam, function (err, result) {
                if (err) {
                    response.end("error")
                    console.log("error-" + err.message)
                    return
                } else {
                    response.end("success")
                    return
                }
            })
        }
    } else if (request.body.code == "1003") {//企业个人中心
        if (request.body.action == "reject") {
            var updateResumelist = "update joblist set restatus = 1 where phone=" + "'" + request.body.stuphone + "'" + "and companyname =" + "'" + request.body.jobtitle + "'"
            query(updateResumelist, function (err, result) {
                if (err) {
                    response.send("error")
                    console.log("error-" + err.message)
                    return
                } else {
                    console.log(updateResumelist)
                    return
                }
            })
        } else if (request.body.action == "notify") {
            console.log(request.body.restatus)
            if (request.body.status == "通知面试") {
                var updateResumelist = "update joblist set restatus = 2 where phone=" + "'" + request.body.stuphone + "'" + "and companyname =" + "'" + request.body.jobtitle + "'"
            } else if (request.body.status == "通知报到") {
                var updateResumelist = "update joblist set restatus = 3 where phone=" + "'" + request.body.stuphone + "'" + "and companyname =" + "'" + request.body.jobtitle + "'"

            } else if (request.body.status == "确认已报到") {
                var updateStatus = "update users set status = 1 where phone=" + "'" + request.body.stuphone + "'";
                query(updateStatus, function (err, result) {
                    if (err) {
                        response.send("error")
                        console.log("error-" + err.message)
                        return
                    }
                })
                var updateResumelist = "update joblist set restatus = 4 where phone=" + "'" + request.body.stuphone + "'" + "and companyname =" + "'" + request.body.jobtitle + "'"
            }
            query(updateResumelist, function (err, result) {
                if (err) {
                    response.send("error")
                    console.log("error-" + err.message)
                    return
                } else {
                    //response.send(JSON.stringify(result))
                    return
                }
            })
        } else {
            var list = new Array()
            var companyInfo = "select * from companyusers WHERE phone =" + "'" + request.session.phone + "'"
            query(companyInfo, function (err, result) {
                if (err) {
                    response.send("error")
                    console.log("error-" + err.message)
                    return
                } else {
                    //response.send(JSON.stringify(result))
                    list.push(result[0])
                    return
                }
            })
            var resumeInfo = "select j.company, j.companyname, j.restatus , r.school, r.major ,u.status, u.name, u.phone from joblist j, resume r, users u where u.phone = j.phone and j.phone = r.phone and j.company =" + "'" + request.session.phone + "'"
            query(resumeInfo, function (err, result) {
                if (err) {
                    response.send("error")
                    console.log("error-" + err.message)
                    return
                } else {
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].restatus == 0) {
                            result[i].restatus = "通知面试"
                            result[i].status = ''
                        } else if (result[i].restatus == 2) {
                            result[i].restatus = "通知报到"
                            result[i].status = ''
                        } else if (result[i].restatus == 3) {
                            result[i].restatus = "确认已报到"
                            result[i].status = ''
                        } else {
                            if (result[i].restatus == 1) {
                                result[i].status = "已拒绝"
                            } else {
                                result[i].status = "已被录用"
                            }
                            result[i].restatus = ''
                        }
                    }
                    list.push(result)
                    response.send(JSON.stringify(list))
                    return
                    return
                }
            })
        }
    }
})

app.use('/', express.static(Config.WebDir))

var server = app.listen(Config.Port, Config.Hostname, function () {
    var host = Config.Hostname
    var port = Config.Port
    log.print("Server Listening on " + host + ":" + port)
})