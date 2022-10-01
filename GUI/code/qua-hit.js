// TODO: switch tag, the same monitor, bug
// TODO: add HIT1 link in the description of HIT2


$(document).ready(function() {
    InitInterface.init();
});

var InitInterface = (function() {
    function init() {
        if (!GetEnvInfo.isPC()) {
            CheckEnv.showWarningCover("mobile-device");
        } else if (screen.width <1360 || screen.width <768) {
            alert(CustomizedValues.WARNING_MESSAGE["resolution"])
        } else {
            if (!GetEnvInfo.isCorrectBrowser()) {
                CheckEnv.showWarningCover("correct-browser");
            } else {
                CheckEnv.init();
                CheckEnvInBackground.init();
                if (CheckEnv.maximize_browser) {
                    CustomizedValues.getSrcImageNumber();
                    Calibration.init();
                    showInstruction.init();
                    showInstruction.initInstrBtn();
                    GetEnvInfo.getOsInfo();
                    InitProgressBar.init(CustomizedValues.traing_imgs_count);
                    InitImage.init();
                    InitImage.getDistortedImage();
                    InitImage.startSection();
                    seeFlickering.init();
                    traingSection.getTrainingTips();
                    // SubmitResult.init();
                    // GetNextImage.init();
                    KeyBoardInput.init();
                    GetSurveyResult.init();
                    if (CustomizedValues.MODE == "offline") {
                        SaveData2CSV.init();
                    }
                } else {
                    CheckEnv.showWarningCover("maximize-browser-refesh");
                }
            }
        }
    }

    return {
        init: init,
    }
})();


var CustomizedValues = (function() {
    var MODE = "amt" // amt/offline, in offline mode, user can download data
    var IS_PILOT_EXP = false;
    var FREQ = Math.round(1000/8);//ms
    var REF_IMG_IDX_MAX = 100; //distorted bg img num
    var REF_IMG_STEP = 100; // 100 -> first jnd
    var SRC_IMG_IDX_LIST = [];
    var training_gt = Object();
    var traing_imgs_count = 0;
    var quiz_imgs_count = 0;
    // var SRC_IMG_IDX_LIST  = shuffle([43, 12, 26]); // 12, 26, 43, 32, 14, 36, 48, 17, number of images must the same as test_img_num, 39
    var IMG_PREFIX_NAME = "../images/";
    var bg_img_idx = 0;// start from 0
    var DISTANCE = 30;//one image
    var IMAGE_WIDTH_CM = 13.797;
    var IMAGE_HEIGHT_CM = 10.347;
    var WARNING_MESSAGE = {"mobile-device":"Mobile Device is not suitable for this work, please use PC, otherwise your work will be rejected."
                        , "maximize-browser": "Please maximize your browser."
                        , "correct-browser": "To enable all interface features, please use Chrome."
                        , "same-monitor": "Please use the same monitor."
                        , "scale-browser": "Please don't change the browser zoom level.<br>\
                                            You can set it back from browser menu, or using the CMD/CTRL and +/- key combination, \
                                            or using CMD/CTRL and mouse scroll combination.<br>\
                                            Thank you."
                        , "please-drag": "Please adjust the slider until you find the flickering critical point." 
                        , "resolution" : "Monitor resolution does not fulfill the requirement. Width>=1366, height>=768."                                      
                        }
    var TRAINING_SLIDER_AUTO_INTERVAL = 20; //ms
    var section = "training"; // training/quiz


    function getSrcImageNumber() { // 43-12-26
        if (CustomizedValues.REF_IMG_STEP != CustomizedValues.REF_IMG_IDX_MAX) {
            $(".next-image").html("Next Group")
        }

        var src_img_idx_list = $(".src-img-num-list").attr("imgurls").split("-");
        for (var i=0; i<src_img_idx_list.length; i++) {
            src_img_idx_list[i] = src_img_idx_list[i].trim();
        }

        var src_img_gt_list = $(".src-img-gt-list").attr("imggts").split("_");
        var traing_imgs = [];
        var quiz_imgs = [];

        for (var i=0; i<src_img_gt_list.length; i++) {
            var gt = src_img_gt_list[i].trim();
            if (gt=="none") {
                quiz_imgs.push(src_img_idx_list[i])
            } else {
                traing_imgs.push(src_img_idx_list[i])
                CustomizedValues.training_gt[src_img_idx_list[i]] = gt.split("-")
            }
        }

        CustomizedValues.traing_imgs_count = traing_imgs.length;
        CustomizedValues.quiz_imgs_count = quiz_imgs.length;
        // training first
        CustomizedValues.SRC_IMG_IDX_LIST = shuffle(traing_imgs).concat(shuffle(quiz_imgs));
        InitImage.src_img_idx_list_copy = Array.from(CustomizedValues.SRC_IMG_IDX_LIST);
    }


    function shuffle(arr) {
        for (let i = 1; i < arr.length; i++) {
            const random = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[random]] = [arr[random], arr[i]];
        }
        return arr
    }

    return {
        getSrcImageNumber: getSrcImageNumber,
        bg_img_idx: bg_img_idx,
        REF_IMG_IDX_MAX: REF_IMG_IDX_MAX,
        REF_IMG_STEP: REF_IMG_STEP,
        FREQ: FREQ,
        SRC_IMG_IDX_LIST: SRC_IMG_IDX_LIST,
        IMG_PREFIX_NAME: IMG_PREFIX_NAME,
        IS_PILOT_EXP: IS_PILOT_EXP,
        DISTANCE: DISTANCE,
        IMAGE_WIDTH_CM: IMAGE_WIDTH_CM,
        IMAGE_HEIGHT_CM: IMAGE_HEIGHT_CM,
        WARNING_MESSAGE: WARNING_MESSAGE,
        TRAINING_SLIDER_AUTO_INTERVAL: TRAINING_SLIDER_AUTO_INTERVAL,
        training_gt: training_gt,
        traing_imgs_count: traing_imgs_count,
        quiz_imgs_count: quiz_imgs_count,
        section: section,
        MODE: MODE,
    }
})();

var CheckEnvInBackground = (function() {
    var interval = null;
    function init() {
        CheckEnvInBackground.interval = setInterval (function() {
            CheckEnv.action();
        }, 300);
    }

    return {
        init: init,
        interval: interval,
    };
})();

var CheckEnv = (function() {
    var correctEnvironment = true;
    var maximize_browser = true;
    var _same_browser = true;
    var _zoom_browser = true;

    function init() {
        storeResolutionInfo();
        action();
    }

    function storeResolutionInfo(){
        StoreData.setStorage("screen_width", screen.availWidth);
        StoreData.setStorage("screen_height", screen.availHeight);
    }

    function action() {
        // have to maximize the browser
        if(screen.availWidth - window.outerWidth > 100 || screen.availHeight - window.outerHeight > 100) {
            showWarningCover("maximize-browser");
            maximize_browser = false;
        } else {
            maximize_browser = true;
        }

        // have to use the same monitor during the experiment
        if (Calibration.isCalibrated || StoreData.getStorage("isCalibrated") == "true") {
            if (screen.availWidth != StoreData.getStorage("screen_width") || screen.availHeight != StoreData.getStorage("screen_height")) {
                showWarningCover("same-monitor");
                _same_browser = false;
            } else {
                _same_browser = true;
            }
        } 

        // the zoom rate have to be fixed during the experiment
        if (Calibration.isCalibrated && Calibration.cali_devicePixelRatio!=0) {
            if (window.devicePixelRatio != Calibration.cali_devicePixelRatio) {
                showWarningCover("scale-browser");
                _zoom_browser = false;
            } else {
                _zoom_browser = true;
            }
        } 

        CheckEnv.correctEnvironment = maximize_browser && _same_browser && _zoom_browser;

        if (CheckEnv.correctEnvironment) {
            hideWarningCover();
        }
    }

    function showWarningCover(message) {
        $(".warning-cover").css("visibility", "visible");
        $(".warning-msg").html(CustomizedValues.WARNING_MESSAGE[message]);
    }

    function hideWarningCover() {
        $(".warning-cover").css("visibility", "hidden");
        $(".warning-msg").html();
    }


    return {
        init: init,
        correctEnvironment: correctEnvironment,
        action: action,
        maximize_browser: maximize_browser,
        showWarningCover: showWarningCover,
    }
})();

var InitProgressBar = (function() {
    var _task_num = 0;
    var task_cnt = 0;
    function init(img_num) {
        InitProgressBar.task_cnt = 0;
        _task_num = (CustomizedValues.REF_IMG_IDX_MAX / CustomizedValues.REF_IMG_STEP) * img_num;
        
        $(".progress-bar").attr("aria-valuemax", _task_num*10)
                        .css("width", 100*(task_cnt/_task_num) + "%")
                        .html(task_cnt + "/" + _task_num);; //progress_step = 10
    }

    function increase() {
        $(".progress-bar").css("width", 100*(InitProgressBar.task_cnt/_task_num) + "%")
                        .html(InitProgressBar.task_cnt + "/" + _task_num);
    }

    return {
        init: init,
        increase: increase,
        task_cnt: task_cnt,
    };
})();

var KeyBoardInput = (function() {
    function init() {
        document.onkeyup = function (event) {
            var e = event || window.event;
            var keyCode = e.keyCode || e.which || e.code;
            switch (keyCode) {
                case 13://space
                case 32://enter
                    if($(".next-image").css("display") == "inline-block") {
                        if ($(".range").attr("hasdrag") == "n") {
                            alert(CustomizedValues.WARNING_MESSAGE["please-drag"]);
                        } else if ($(".tryagain-btn").css('visibility') == 'visible') {
                            traingSection.getTrainingTipsAction();
                        } else if ($(".range").attr("hasdrag") == "y") {
                            BtnAnimation.init("next-image");
                            seeFlickering.action();
                        } 

                    } else if($(".submit-result").css("display") == "inline-block") {
                        BtnAnimation.init("submit-result");
                        SubmitResult.action();
                    }
                    break;
                default:
                    break;
            }
        }

        document.onkeydown = function (event) {
            var e = event || window.event;
            var keyCode = e.keyCode || e.which;
            switch (keyCode) {
                case 38://up arrow
                    e.preventDefault();
                    if (Calibration.isCalibrated == false) {
                        $(".finish-calibration").css("visibility", "visible");
                        Calibration.setCalibrationStartTimestamp();
                        Calibration.increase();
                    }
                    break;
                case 40://down arrow
                    e.preventDefault();
                    if (Calibration.isCalibrated == false) {
                        $(".finish-calibration").css("visibility", "visible");
                        Calibration.setCalibrationStartTimestamp();
                        Calibration.decrease();    
                    }
                    break;
                default:
                    break;
            }
        }
    }
    return {
        init: init
    };
})();


var GetEnvInfo = (function() {
    var user_os_info = "";
    function getOsInfo() {
        for (key in window.navigator) {
            if (!$.isFunction(window.navigator[key]) && typeof window.navigator[key] != 'object') {
                GetEnvInfo.user_os_info += key+":"+window.navigator[key] + ";"; 
            }
        }  
      
        for (key in window.screen) {
            if (!$.isFunction(window.navigator[key]) && typeof window.navigator[key] != 'object') {
                GetEnvInfo.user_os_info += key+":"+window.navigator[key] + ";"; 
            }
        }  

        GetEnvInfo.user_os_info += "Resolution:"+screen.width+"*"+screen.height+";"
                    +"PixelRatio:"+window.devicePixelRatio+";"
                    +"TimeZone:"+(-new Date().getTimezoneOffset()/60)+";"

        if (/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
            GetEnvInfo.user_os_info += "Downlink:" + navigator.connection.downlink * 1024 /8 + ";"
        }
    }
      
    function isPC() {
        var userAgentInfo = navigator.userAgent.toLowerCase();
        var Agents = ["android", "iphone", "symbianos", "windows phone", "ipad", "ipod"];
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) >= 0) {
                CheckEnv.showWarningCover("mobile-device");
                return false;
            }
        }
        return true;
    }

    function isCorrectBrowser() {
        var isChrome = !!window.chrome;
        if (isChrome) {
            return true;
        } else {
            CheckEnv.showWarningCover("correct-browser");
            return false;
        }
    }

    return {
        user_os_info: user_os_info,
        isPC: isPC,
        isCorrectBrowser: isCorrectBrowser,
        getOsInfo: getOsInfo,
    };
})();

var Calibration = (function() {
    var isCalibrated = false;
    var calibration_start_timestamp = "";
    var cali_devicePixelRatio = 0;

    function init() {
        checkCalibration();
        keepIncreasingInit();
        keepDecreasingInit();

        if (!(StoreData.getStorage("isCalibrated")=="true" || StoreData.getStorage("isCalibrated")=="false")) {
            StoreData.setStorage("isCalibrated", "false");
        }

        $(".finish-calibration").click(function(event){
            var calibration_time = (new Date()).getTime() - calibration_start_timestamp;
            GetEnvInfo.user_os_info += "calibration_time:" + calibration_time + ";"
            StoreData.setStorage("calibration_time", calibration_time);
            scaleImage();
        });

        $(".adjust-distance").click(function(event){
            $(".display-panel").css("display", "none");
            $(".jnd-panel").css("display", "inline");
            
            $(".next-image").css("display", "inline");
            $(".range").focus();
            Flickering.init();
            $(".image-panel, .controler-panel, .section-msg").css("display", "inline");
            $(".image-panel, .controler-panel").css("visibility", "hidden");
            $(".range").attr("disabled", true);
            $(".next-image").attr("disabled", true);
        });
    }

    function keepIncreasingInit() {
        var frameEvent = null;
        $(".zoom-in-frame").mousedown(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                $(".finish-calibration").css("visibility", "visible");
                setCalibrationStartTimestamp();
                frameEvent = setInterval (function() {
                    increase();
                }, 30);
            }
        })

        $(".zoom-in-frame").mouseup(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                clearInterval(frameEvent);
            }
        })

        $(".zoom-in-frame").mouseleave(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                clearInterval(frameEvent);
            }
        })
    
    }

    function setCalibrationStartTimestamp() {
        if (!calibration_start_timestamp) {
            calibration_start_timestamp = (new Date()).getTime();
        }
    }

    function keepDecreasingInit() {
        var frameEvent = null;
        $(".zoom-out-frame").mousedown(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                $(".finish-calibration").css("visibility", "visible");
                setCalibrationStartTimestamp();
                frameEvent = setInterval (function() {
                    decrease();
                }, 30);
            }
        })

        $(".zoom-out-frame").mouseup(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                clearInterval(frameEvent);
            }
        })

        $(".zoom-out-frame").mouseleave(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                clearInterval(frameEvent);
            }
        })
    }

    function increase() {
        $(".card-area").width($(".card-area").width() * 1.005)
                        .height($(".card-area").height() * 1.005);
    }

    function decrease() {
        $(".card-area").width($(".card-area").width() / 1.005)
                        .height($(".card-area").height() / 1.005);
    }

    function scaleImage() {
        // var frame_height = $(".card-area").height();
        // w=53.98 mm, h=85.60mm. ISO 7810
        // var image_width = 0.6 * document.documentElement.clientWidth; //20%, 20%
        // var physical_width = (image_width * 85.60 / frame_width)/10; //cm        
        // var distance = Math.round((physical_width / 2.) / Math.tan(Math.PI / 12.));

        var frame_width = $(".card-area").width() + 6; //px
        var px_cm_rate = frame_width / 8.56
        var browser_width_cm = Math.ceil(screen.width / px_cm_rate);
        var browser_height_cm = Math.ceil(screen.height  / px_cm_rate);

        Calibration.cali_devicePixelRatio = window.devicePixelRatio;

        GetEnvInfo.user_os_info += "px_cm_rate:" + px_cm_rate + ";" 
                                + "browser_width_cm:" + browser_width_cm +";"
                                + "browser_height_cm:" + browser_height_cm +";"
                                + "cali_devicePixelRatio:" + Calibration.cali_devicePixelRatio +";"

        StoreData.setStorage("px_cm_rate", px_cm_rate);
        StoreData.setStorage("browser_width_cm", browser_width_cm);
        StoreData.setStorage("browser_height_cm", browser_height_cm);
        StoreData.setStorage("cali_devicePixelRatio", Calibration.cali_devicePixelRatio);
        

        StoreData.setStorage("isCalibrated", "true");
        Calibration.isCalibrated = true;
        $(".image, .loading-image").css("width", px_cm_rate*CustomizedValues.IMAGE_WIDTH_CM).css("height", px_cm_rate*CustomizedValues.IMAGE_HEIGHT_CM);
        $(".range, .image-panel, .image-pool").css("width", px_cm_rate*CustomizedValues.IMAGE_WIDTH_CM)
        $(".card-panel").css("display", "none"); 
        $(".distance-value").html("Please adjust your distance. Distance= " + CustomizedValues.DISTANCE + " cm"+ " (" + (CustomizedValues.DISTANCE*0.393701).toFixed(0) + " inch)");
        $(".browser-width-cm").html("Browser width: " + browser_width_cm + "cm (" + Math.ceil(browser_width_cm*0.393701) +"inch)");
        $(".display-panel").css("display", "inline");
    }

    function checkCalibration() {
        if (StoreData.getStorage("outerWidth") == null 
            && StoreData.getStorage("outerHeight") == null
            && StoreData.getStorage("availWidth") == null
            && StoreData.getStorage("availHeight") == null) {
            StoreData.setStorage("outerWidth", window.outerWidth);
            StoreData.setStorage("outerHeight", window.outerHeight);
            StoreData.setStorage("availWidth", screen.availWidth);
            StoreData.setStorage("availHeight", screen.availHeight);
            StoreData.setStorage("isCalibrated", "false");
            Calibration.isCalibrated == false;
        } 

        if (StoreData.getStorage("isCalibrated") == "true"
            && window.outerWidth == StoreData.getStorage("outerWidth") 
            && window.outerHeight == StoreData.getStorage("outerHeight") 
            && screen.availWidth == StoreData.getStorage("availWidth") 
            && screen.availHeight == StoreData.getStorage("availHeight")) {

            Calibration.isCalibrated = true;
            hadCalibrated();

        } else {
            StoreData.setStorage("isCalibrated", "false");
            Calibration.isCalibrated = false;
            StoreData.setStorage("outerWidth", window.outerWidth);
            StoreData.setStorage("outerHeight", window.outerHeight);
            StoreData.setStorage("availWidth", screen.availWidth);
            StoreData.setStorage("availHeight", screen.availHeight);
        }

        if (Calibration.isCalibrated == false) {
            $(".card-panel").css("display", "inline");
        }
    }

    function hadCalibrated() {
        var px_cm_rate = StoreData.getStorage("px_cm_rate");
        var browser_width_cm = StoreData.getStorage("browser_width_cm");
        var browser_height_cm = StoreData.getStorage("browser_height_cm");
        Calibration.cali_devicePixelRatio = StoreData.getStorage("cali_devicePixelRatio");
        var calibration_time = StoreData.getStorage("calibration_time");
        

        GetEnvInfo.user_os_info += "px_cm_rate:" + px_cm_rate + ";" 
                                + "browser_width_cm:" + browser_width_cm +";"
                                + "browser_height_cm:" + browser_height_cm +";"
                                + "cali_devicePixelRatio:" + Calibration.cali_devicePixelRatio +";"
                                + "calibration_time:" + calibration_time +";"

        $(".browser-width-cm").html("Browser width: " + browser_width_cm + "cm (" + Math.ceil(browser_width_cm*0.393701) +"inch)");
        $(".image, .loading-image, .image-pool").css("width", px_cm_rate*CustomizedValues.IMAGE_WIDTH_CM).css("height", px_cm_rate*CustomizedValues.IMAGE_HEIGHT_CM);
        $(".range, .image-panel").css("width", px_cm_rate*CustomizedValues.IMAGE_WIDTH_CM)
        $(".card-panel").css("display", "none");
        $(".distance-value").html("Please adjust your distance. Distance= " + CustomizedValues.DISTANCE + " cm"+ " (" + (CustomizedValues.DISTANCE*0.393701).toFixed(0) + " inch)");
        $(".display-panel").css("display", "inline");
    }

    return {
        init: init,
        increase: increase,
        decrease: decrease,
        isCalibrated: isCalibrated,
        setCalibrationStartTimestamp: setCalibrationStartTimestamp,
        cali_devicePixelRatio: cali_devicePixelRatio,
    };
})();

var BtnAnimation = (function(btnclass) {
    function init(btnclass) {
        var cls = $("." + btnclass).attr('class').split(" ").find(t=>t.startsWith("btn-"));

        $("." + btnclass).removeClass(cls);
        $("." + btnclass).addClass("btn-outline-secondary");
        btnInterval = setInterval (function() {
            $("." + btnclass).removeClass("btn-outline-secondary");
            $("." + btnclass).addClass(cls);
            clearInterval(btnInterval);
        }, 200);
    }

    return {
      init: init
    };
})();

var Flickering = (function() {
    var _cnt = 0;
    
    var flicker = null;
    function init() {
        Flickering.flicker = setInterval (function() {
            if (InitImage.isStart) {
                if (InitImage.distorted_val >= 0) {
                    $(".curr-display").removeClass("curr-display");
                    if (InitImage.distorted_img_id != InitImage.ref_img_id) {
                        if (_cnt%2 === 0) {
                            $("#" + InitImage.distorted_img_id).removeClass("curr-display");
                            $("#" + InitImage.ref_img_id).addClass("curr-display");
        
                        } else if (_cnt%2 == 1) {
                            $("#" + InitImage.distorted_img_id).addClass("curr-display");
                            $("#" + InitImage.ref_img_id).removeClass("curr-display");
                            $(".range").focus();
                        }
                        _cnt++;
                        _cnt = _cnt%2;
                    } else if (InitImage.distorted_img_id == InitImage.ref_img_id) {
                        $("#" + InitImage.ref_img_id).addClass("curr-display");
                    }
    
                }
            }
        }, CustomizedValues.FREQ);
    }

    return {
        init: init,
        flicker: flicker,
    };
})();

var InitImage = (function() {
    var src_img_idx_list_copy = [];
    var dis_imgurls = [];
    var ref_img = ""; // src image id, no compressed
    var ref_img_id = ""; // if not first jnd, distorted image can be reference image
    var distorted_val = 0;
    var distorted_img_id = "";
    var slider_tracking = "";
    var isStart = false;
    var curr_src_num = 0;
    
    var dis_imgids = [];

    function init() {
        if (InitImage.ref_img_id != "") {
            $("." + "src-" + InitImage.ref_img_id.split("_")[0]).remove();
        }

        $(".range").focus().attr("max", CustomizedValues.REF_IMG_IDX_MAX);
        InitImage.curr_src_num = InitImage.src_img_idx_list_copy.shift();
        if (CustomizedValues.traing_imgs_count > 0) {
            CustomizedValues.traing_imgs_count -= 1;
        } else if (CustomizedValues.traing_imgs_count==0) { // switch section, remove training result

            
            SubmitResult.train_track = SubmitResult.result;
            SubmitResult.result = {};


            CustomizedValues.traing_imgs_count = -1
            CustomizedValues.section = "quiz"
            InitImage.isStart = false;

            $(".image-panel, .controler-panel").css("visibility", "hidden");
            $(".loading-image-div").css("z-index", "-1").css("visibility", "hidden");

            $(".section-name").html("Quiz").removeClass("text-primary").addClass("text-warning");
            $(".section-tips").html(`In this session, you will carry out a task to \
                            find the flickering critical points of ${CustomizedValues.quiz_imgs_count} images. \
                            Only if you pass the quiz you are allowed to do more HITs in this study. Spending around 30 seconds finding the critical point is recommended.`);
            $(".start-section").html("Start Quiz")
                            .css("visibility", "visible")
                            .removeClass("btn-primary")
                            .addClass("btn-warning");
        }
    
        genImagelist_obj = genImagelist(InitImage.curr_src_num);
        InitImage.ref_img = genImagelist_obj["ref_img_url"];
        InitImage.ref_img_id = genImagelist_obj["ref_img_id"];
        InitImage.dis_imgurls = genImagelist_obj["dis_imgurls"];
        InitImage.dis_imgids = genImagelist_obj["dis_imgids"];

        // SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];

        InitImage.distorted_img_id = InitImage.ref_img_id;
        InitImage.distorted_val = 0;
        CustomizedValues.bg_img_idx = 0;

        

        createImageDom(isNextGroup = false, InitImage.ref_img_id
                        , InitImage.ref_img
                        , InitImage.dis_imgids
                        , InitImage.dis_imgurls);

        // getDistortedImage();
        // startSection();
    }

    function startSection() {
        $(".start-section").click(function(event){
            InitImage.isStart = true;
            SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];
            $(".range").attr("disabled", false);
            $(".next-image").attr("disabled", false);
            $(".start-section").css("visibility", "hidden");

            $(".image-panel, .controler-panel").css("visibility", "visible");

            if (CustomizedValues.section == "quiz") {
                InitProgressBar.init(CustomizedValues.quiz_imgs_count)
            }
        });  
    }


    function getDistortedImage() {
        $(".range").on("input", function() { 
            InitImage.sliderChangeAction();
        });
    }

    function sliderChangeAction() {
        if ($(".range").attr("hasdrag") == "n") {
            $(".range").attr("hasdrag", "y");
        }


        InitImage.slider_tracking += "+" + $(".range").val()+ "-" + (new Date()).getTime();
        InitImage.distorted_val = parseInt($(".range").val());
        var dis_val = InitImage.distorted_val;
        $(".factor").html(`Distortion Level: ${dis_val}`);
        InitImage.distorted_img_id = InitImage.ref_img_id;
        if (InitImage.distorted_val>0) {
            InitImage.distorted_img_id = InitImage.dis_imgids[(CustomizedValues.REF_IMG_IDX_MAX+1) - InitImage.distorted_val] // slider value > 0 
        }
    }

    function genImagelist(new_img_name) {
        var next_ref_img_id = new_img_name;

        tmp_name_list = next_ref_img_id.split("_")

        var next_ref_img_url = CustomizedValues.IMG_PREFIX_NAME 
                                + tmp_name_list[0] 
                                + "_" + tmp_name_list[1] + ".png";

        var next_imgurls = Array();
        var next_imgids = Array();
        for (var i=1; i<=CustomizedValues.REF_IMG_IDX_MAX; i++) {
            var next_dis_iamge_id = next_ref_img_id + "_" + (Array(3).join("0") + i).slice(-3);
            next_imgids.push(next_dis_iamge_id);
            next_imgurls.push(CustomizedValues.IMG_PREFIX_NAME + next_dis_iamge_id + ".jpg")
        }
        return {"ref_img_url": next_ref_img_url
                , "dis_imgurls": next_imgurls
                , "ref_img_id":next_ref_img_id+"_000"
                , "dis_imgids": next_imgids};
    }

    function createImageDom(isNextGroup
                            ,ref_image_id
                            , ref_image_url
                            , distorted_img_id_list
                            , distorted_img_url_list
                            ) {
                                
        var img_id_list = distorted_img_id_list
        var img_url_list = distorted_img_url_list
        img_id_list.unshift(ref_image_id);
        img_url_list.unshift(ref_image_url);

        if ($("#" + ref_image_id).length == 0) {

            for (var i=0, l=img_id_list.length; i<l; i++) {
                var image_dom = "<div class='image-cover "
                                + img_id_list[0].split("_")[0]  + "-" + img_id_list[0].split("_")[1] 
                                + "' id='" +  img_id_list[i] 
                                + "' style='z-index:-1'>"
                                + "<img alt='test image' class='image' "
                                + "src='" + img_url_list[i] + "'>"
                                +"</div>"
    
                $(image_dom).appendTo($(".image-pool"));
            }
        }

        if (!isNextGroup) { // if the last image is downloaded, then all the images are downloaded
            img_url_list = img_url_list.slice(img_url_list.length-1);
        }

        preloadGroupImages(isNextGroup, img_url_list, 0);
    }

    function preloadGroupImages(isNextGroup, imageArray, index) {
        index = index || 0;
        if (imageArray && imageArray.length > index) {
            var img = new Image();
            img.onload = function() {
                if (isNextGroup) {
                    preloadGroupImages(isNextGroup, imageArray, index + 1);
                } else {
                    preloadGroupImages(isNextGroup, imageArray, index + 1);
                    if (index+1 == imageArray.length){displayAfterloading();}
                }
            }
            img.src = imageArray[index];
        }
    } 

    function displayAfterloading() {  
        $(".loading-image-div").css("z-index", "-1").css("visibility", "hidden");
        $(".image-pool").css("z-index", "1");
        if (InitImage.isStart) {
            $(".next-image, .range").attr("disabled", false);
            $(".range").focus();
        }

        SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];
        
        if (InitImage.src_img_idx_list_copy.length > 0) {
            var next_ref_img = "";
            var next_group_imgurls = [];
            var next_img = InitImage.src_img_idx_list_copy[0];
            genImagelist_obj = genImagelist(next_img);
            next_ref_img = genImagelist_obj["ref_img_url"];
            next_ref_img_id = genImagelist_obj["ref_img_id"];
            next_group_imgurls = genImagelist_obj["dis_imgurls"];
            next_group_imgids = genImagelist_obj["dis_imgids"];

            createImageDom(isNextGroup = true, next_ref_img_id
                            , next_ref_img
                            , next_group_imgids
                            , next_group_imgurls);
        }
    }

    return {
        init: init,
        isStart: isStart,
        genImagelist: genImagelist,
        dis_imgurls: dis_imgurls,
        ref_img: ref_img,
        distorted_val: distorted_val,
        distorted_img_id: distorted_img_id,
        slider_tracking: slider_tracking,
        src_img_idx_list_copy: src_img_idx_list_copy,
        ref_img_id: ref_img_id,
        dis_imgids: dis_imgids,
        sliderChangeAction: sliderChangeAction,
        curr_src_num:curr_src_num,
        getDistortedImage: getDistortedImage,
        startSection: startSection,
    };
})();

var traingSection = (function() {
    var worker_val = 0;
    function isCorrectResult() {
        var range_start = parseInt(CustomizedValues.training_gt[InitImage.curr_src_num][0]);
        var range_end = parseInt(CustomizedValues.training_gt[InitImage.curr_src_num][1]);
        var result = InitImage.distorted_val;
        worker_val = InitImage.distorted_val;
        if (result>=range_start && result<=range_end) {
            return true;
        } else {
            return false;
        }  
    }

    function coaching() {
        var range_start = parseInt(CustomizedValues.training_gt[InitImage.curr_src_num][0]);
        var range_end = parseInt(CustomizedValues.training_gt[InitImage.curr_src_num][1]);

        InitImage.slider_tracking += "+" + "Train"+ "-" + (new Date()).getTime();
        $(".tryagain-btn").css('visibility', 'hidden');
        $(".range").attr("disabled", true);
        $(".controler-panel").css("display", "none");

        $(".training-msg").css("display", "inline-block");
        $(".training-tips").html(`<span class='text-danger'>Your answer is not correct. \
                                Please note that your slider must be in a position \
                                where you can see the flickering on the image, \
                                and there is no flickering before your selected position. \
                                Hint: The correct answer is in the range from ${range_start} to ${range_end}.</span>`);

        setTimeout(function(){ 
            $(".tryagain-btn").css('visibility', 'visible'); 
        }, 2000);
    }

    function getTrainingTips() {
        $(".tryagain-btn").click(function(event){
            getTrainingTipsAction();
        });  
    }

    function getTrainingTipsAction() {
        $(".controler-panel").css("display", "inline");
        $(".training-msg").css("display", "none");
        InitImage.distorted_val = worker_val;
        // moveSlider(worker_val, worker_val);
        $(".range").attr("disabled", false);
        $(".tryagain-btn").css('visibility', 'hidden');
    }

    function moveSlider(start_point, end_point) {
        if (start_point <=100 && start_point >=0 && end_point<=100 && end_point >=0) {
            $(".tryagain-btn").css('visibility', 'hidden');
            var dir = "f";
            if (start_point > end_point) {
                dir = "b"
            }
            var interval = setInterval (function() {
                $(".range").val(start_point);
                InitImage.sliderChangeAction();
                if (start_point==end_point) {
                    clearInterval(interval);
                    $(".tryagain-btn").css('visibility', 'visible');
                    if ($(".tryagain-btn").html() == "OK") {
                        $(".tryagain-btn").html("Continue");
                    } else if ($(".tryagain-btn").html() == "Continue") {
                        $(".tryagain-btn").html("OK");
                    }
                    
                } else {
                    if (dir == "f") {
                        start_point = start_point + 1 ;
                    } else if (dir == "b") {
                        start_point = start_point - 1 ;
                    }
                }
            }, CustomizedValues.TRAINING_SLIDER_AUTO_INTERVAL);
        }
    }

    return {
        isCorrectResult: isCorrectResult,
        coaching: coaching,
        getTrainingTips: getTrainingTips,
        getTrainingTipsAction: getTrainingTipsAction,
    };
})();

var seeFlickering = (function() {
    var _curr_img_count = 0;

    function init() {
        $(".next-image").click(function(event){
            action();
        });
    }

    function action() {
        if ($(".range").attr("hasdrag") == "y") {
            var curr_image_dom_class = InitImage.curr_src_num.split("_")[0] 
                                    + "-" + InitImage.curr_src_num.split("_")[1]
            
            if (CustomizedValues.section == "quiz") {
                noCoachingAction();
                $(`.${curr_image_dom_class}`).remove(); // remove image dom
            } else if (CustomizedValues.section == "training") {
                if (traingSection.isCorrectResult()){
                    noCoachingAction();
                    $(`.${curr_image_dom_class}`).remove(); // remove image dom
                } else {
                    traingSection.coaching();
                }
            }
        } else if ($(".range").attr("hasdrag") == "n") {
            alert(CustomizedValues.WARNING_MESSAGE["please-drag"]);
        } 
    }

    function noCoachingAction() {
        $(".range").attr("hasdrag", "n");
        InitProgressBar.task_cnt += 1;
        InitProgressBar.increase();
        SubmitResult.result[InitImage.ref_img][0] = InitImage.distorted_val;
        SubmitResult.result[InitImage.ref_img][1] = (CustomizedValues.REF_IMG_IDX_MAX+1) - InitImage.distorted_val;
        SubmitResult.result[InitImage.ref_img][3] = (new Date()).getTime();
        SubmitResult.result[InitImage.ref_img][4] = InitImage.slider_tracking;
        InitImage.slider_tracking = [];

        CustomizedValues.bg_img_idx += CustomizedValues.REF_IMG_STEP;
        if (CustomizedValues.bg_img_idx < CustomizedValues.REF_IMG_IDX_MAX) { //0,10,..,90
            InitImage.ref_img_id = InitImage.dis_imgids[(CustomizedValues.REF_IMG_IDX_MAX+1)-CustomizedValues.bg_img_idx]; // image index start from 1
            SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];

            $(".range").attr("min", CustomizedValues.bg_img_idx).val(CustomizedValues.bg_img_idx);
            var dis_val = CustomizedValues.bg_img_idx;
            $(".factor").html(`Distortion Level: ${dis_val}`);
            InitImage.distorted_img_id = InitImage.ref_img_id;
            InitImage.distorted_val = CustomizedValues.bg_img_idx;
        } else {
            _curr_img_count ++;
            if (_curr_img_count < CustomizedValues.SRC_IMG_IDX_LIST.length) {
                $(".range").attr("disabled", true);
                clearInterval(Flickering.flicker);
                get_next_image();
            } else {// end exp
                clearInterval(Flickering.flicker);
                clearInterval(CheckEnvInBackground.interval);
                $(".range").attr("disabled", true);
                $(".next-image").css("display", "none");

                if (CustomizedValues.MODE=="offline") {
                    $(".tocsv").css("display", "inline");
                }
                // sibmit an string as survey  
                $("input.survey").val(GetSurveyResult.survey_result);


                $(".instruction").css("display", "none");
                $(".distortion-level").css("display", "none");
                $(".range").css("display", "none");
                $(".progress").css("display", "none");
                $(".section-msg").css("display", "none");

                $(".tips").html("Thank you for your participation! Please submit your HIT result. \
                                <br> <span class='text-primary'>Your assignment will be approved as soon as possible. \
                                If you passed the quiz, you are allowed to do more HITs. \
                                You can search “MMSP Konstanz” in MTurk for more HITs, \
                                or get the link from your approved HIT feedback in MTurk dashboard.</span>");

                //for pilot experiment
                if (CustomizedValues.IS_PILOT_EXP) {
                    if (!GetSurveyResult.didSurveyBefore()) {
                        $(".open-survey").css("display", "inline");
                        $(".tips").html("Thank you for your participation! \
                                    <br>Please take a take a short survey before submiting your HIT result. \
                                    <br> <span class='text-primary'>Your assignment will be approved as soon as possible. \
                                    If you passed the quiz, you are allowed to do more HITs. \
                                    You can search “MMSP Konstanz” in MTurk for more HITs, \
                                    or get the link from your approved HIT feedback in MTurk dashboard.</span>"); 
                    } 
                }

            
                
                // save data to AMT dom ;
                $("input.result").val(JSON.stringify(SubmitResult.result));
                $("input.train-track").val(JSON.stringify(SubmitResult.train_track));
                $("input.os-info").val(GetEnvInfo.user_os_info);

                if (CustomizedValues.MODE=="amt") {
                    $("#submitButton").css("display", "inline"); 
                }
            }
        }
    }


    function get_next_image() {
        $(".curr-display").removeClass("curr-display");
        $(".loading-image-div").css("z-index", "1").css("visibility", "visible");
        $(".image-pool").css("z-index", "-1");
        $(".range").attr("hasdrag", "n").attr("disabled", true).attr("min", "0").val(0);
        $(".next-image").css("display", "inline").attr("disabled", true);
        $(".factor").html("Distortion Level: 0");
        InitImage.init();
        Flickering.init();
    }

    return {
        init: init,
        action: action,
    };
})();


var showInstruction = (function() {
    function initInstrBtn() {
        $(".showInstr").click(function() {
            showInstruction.init();
        })

        $(".instr-close-btn").click(function() {
            clearInterval(instructionFlickering.flicker);
        })
    }

    function init() {
        $("#instruction-modal").modal("show")
        instructionFlickering.init();
    }

    return {
        init: init,
        initInstrBtn: initInstrBtn,
    };
})();


var instructionFlickering = (function () {
    var _cnt = 0;
    var flicker = null;

    function init() {
        instructionFlickering.flicker = setInterval(function () {
        $(".instr-active").removeClass("instr-active");
        
        if (_cnt % 2 === 0) {
          $(".instr-dis-img").addClass("instr-active");
        } else if (_cnt % 2 == 1) {
          $(".instr-ref-img").addClass("instr-active");
        }
        _cnt++;
        _cnt = _cnt % 2;
      }, CustomizedValues.FREQ);
    }

    return {
      init: init,
      flicker: flicker,
    };
})();

var GetSurveyResult = (function() {

    var survey_result = "survey result:";
    function init() {
        $(".save-survey").click(function(event){
            getResult();
        });
    }

    function getResult() {
        var survey_items = ["inst", "pay", "job"];
        var item_group = [];
        var cnt = 0;
        for (var i = 0, length1 = survey_items.length; i < length1; i++) {
            item_group = $("input[name='" + survey_items[i] + "']");
            for (var j = 0, length2 = item_group.length; j < length2; j++) {
                if (item_group[j].checked) {
                    cnt += 1;
                    GetSurveyResult.survey_result += survey_items[i] + "=" + item_group[j].value + ";";
                    break;
                }
            }
        }

        GetSurveyResult.survey_result += "suggestion:" + $("#suggestion").val();
        $("input.survey").val(GetSurveyResult.survey_result);

        if (cnt == 3) {
            $(".open-survey").attr("disabled", true);
            StoreData.setStorage("didSurveyBefore", "true");
        } else {
            StoreData.setStorage("didSurveyBefore", "false");
        }
    }


    function didSurveyBefore() {
        if (StoreData.getStorage("didSurveyBefore") && StoreData.getStorage("didSurveyBefore")=="true") {
            return true;
        } else {
            return false;
        }
    }

    return {
        init:init,
        survey_result: survey_result,
        didSurveyBefore: didSurveyBefore,
    }

})();

var StoreData=(function(){
    function setStorage(key,value){
        localStorage.setItem(key,value)
    }

    function getStorage(key){
        return localStorage.getItem(key)
    }

    return {
      setStorage: setStorage,
      getStorage: getStorage,
    };
})();

var SubmitResult = (function() {
    var result = {};
    var train_track = {};

    function init() {
        $(".submit-result").click(function(event){
            action();
        });
    }

    function action() {
        $(".submit-result").css("display", "none");
        if (CustomizedValues.MODE=="offline") {
            $(".tocsv").css("display", "inline");
        }
    }
    return {
        init: init,
        action: action,
        result: result,
    };
})();

var SaveData2CSV = (function() {
    var _data = "";
    function init() {
        $(".tocsv").click(function(event){
            convertData();
            $(".tocsv").attr("download", (new Date()).getTime()+"_slider.csv").attr("href", "data:text/csv;charset=utf-8," + _data);
        });
    }

    function convertData() {
        var output = "";
        $.each(SubmitResult.result, function(img, val) {
            output += img + "," + val[0] + "," + val[1] + "," + val[2] + "," + val[3] + "," + val[4] + "\n"
        })
        _data = "Ref Image,Distortion Level,JND Point(IMG), Start Timestamp, End Timestamp, Slider Tracking\n" + output;
        _data =  encodeURIComponent(_data);
    }

    return {
        init: init
    };
})();

