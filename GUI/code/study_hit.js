$(document).ready(function() {
    InitInterface.init();
});

var InitInterface = (function() {
    function init() {
        if (!GetEnvInfo.isPC()) {
            CheckEnv.showWarningCover("mobile-device");
        } else if (screen.width <=1360 || screen.width <=768) {
            alert(CustomizedValues.WARNING_MESSAGE["resolution"])
        } else {
            if (!GetEnvInfo.isCorrectBrowser()) {
                CheckEnv.showWarningCover("correct-browser");
            } else {
                CheckEnv.init();
                CheckEnvInBackground.init();
                if (CheckEnv.maximize_browser) {
                    CustomizedValues.check_recorded();
                    if (!StoreData.getStorage("have_qulification")) {
                        StoreData.setStorage("have_qulification", "true")
                    } 
                    
                    if (StoreData.getStorage("have_qulification") == "true") {
                        if (parseInt(StoreData.getStorage("hit_num")) >= CustomizedValues.MAX_HIT) {
                            $("#failed-modal-text").html(CustomizedValues.WARNING_MESSAGE["reach_max_hit_hum"]);
                            $("#failed-modal-btn").html("OK");
                            $("#failed-test-modal").modal("show");
                        } else {
                            CustomizedValues.getSrcImageNumber();
                            Calibration.init();
                            showInstruction.init();
                            showInstruction.initInstrBtn();
                            GetEnvInfo.getOsInfo();
                            InitProgressBar.init();
                            InitImage.init();
                            InitImage.getDistortedImage();
                            InitImage.startExperiment();
                            seeFlickering.init();
                            // SubmitResult.init();
                            // GetNextImage.init();
                            KeyBoardInput.init();
                            GetSurveyResult.init();
                            // SaveData2CSV.init();
                        }
                    } else if (StoreData.getStorage("have_qulification") == "false") {
                        $("#failed-modal-text").html(CustomizedValues.WARNING_MESSAGE["lose_qulification"]);
                        $("#failed-modal-btn").html("OK");
                        $("#failed-test-modal").modal("show");
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
    var IS_PILOT_EXP = false;
    var FREQ = Math.round(1000/8);//ms
    var REF_IMG_IDX_MAX = 100; //distorted bg img num
    var REF_IMG_STEP = 100; // 100 -> first jnd
    var SRC_IMG_IDX_LIST = [];
    // var SRC_IMG_IDX_LIST  = shuffle([43, 12, 26]); // 12, 26, 43, 32, 14, 36, 48, 17, number of images must the same as test_img_num, 39
    var IMG_PREFIX_NAME = "../images/";

    var bg_img_idx = 0;// start from 0
    var DISTANCE = 30;//one image
    var IMAGE_WIDTH_CM = 13.797;
    var IMAGE_HEIGHT_CM = 10.347;
    var test_image = "";
    var pass_test = false;

    /* Need to check before publishing HIT in production environment */
    var PASS_ACC = 0.7;
    var PASS_TOTAL_THRES = 10;
    var EXP_NAME = "main_exp_12.25"
    var MAX_HIT = 30;

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
                        , "lose_qulification": "Unfortunately, you lost the qulification for this study because you failed lots of test questions. You are not allowed to do more HIT from this study."
                        , "reach_max_hit_hum": `Dear participant, you have finished ${MAX_HIT} HITs. You are not allowed to do more HIT from this study. Thank you for your cooperation.`
                        }

    function check_recorded() {
        if(!StoreData.getStorage("exp_name") || StoreData.getStorage("exp_name") != this.EXP_NAME) {   
            StoreData.setStorage("exp_name", this.EXP_NAME);
            StoreData.setStorage("acc_record", JSON.stringify({"total":0, "passed":0, "failed":0, "acc":0}));
            StoreData.setStorage("have_qulification", "true");
            StoreData.setStorage("hit_num", 0);
        }
    }

    function getSrcImageNumber() { // 43-12-26
        if (CustomizedValues.REF_IMG_STEP != CustomizedValues.REF_IMG_IDX_MAX) {
            $(".next-image").html("Next Group")
        }
        
        var src_img_idx_list = $(".src-img-num-list").attr("imgurls").split("-");
        for (var i=0; i<src_img_idx_list.length; i++) {
            src_img_idx_list[i] = src_img_idx_list[i].trim();
        }


        var tmp_name_list = src_img_idx_list[0].split("_") //["Study", "SRC06", "BPG"]
        
        CustomizedValues.test_image = CustomizedValues.IMG_PREFIX_NAME 
                                    + tmp_name_list[0] 
                                    + "_" + tmp_name_list[1] + ".png";
        
        CustomizedValues.SRC_IMG_IDX_LIST = shuffle(src_img_idx_list);
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
        test_image: test_image,
        pass_test: pass_test,
        PASS_ACC: PASS_ACC,
        PASS_TOTAL_THRES: PASS_TOTAL_THRES,
        EXP_NAME: EXP_NAME,
        check_recorded: check_recorded,
        MAX_HIT: MAX_HIT,
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
    function init() {
        _task_num = (CustomizedValues.REF_IMG_IDX_MAX / CustomizedValues.REF_IMG_STEP) * CustomizedValues.SRC_IMG_IDX_LIST.length;
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
                        Calibration.setClibrationStartTimestamp();
                        Calibration.increase();
                    }
                    break;
                case 40://down arrow
                    e.preventDefault();
                    if (Calibration.isCalibrated == false) {
                        $(".finish-calibration").css("visibility", "visible");
                        Calibration.setClibrationStartTimestamp();
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
        // TODO: the same browser
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
        });
    }

    function keepIncreasingInit() {
        var frameEvent = null;
        $(".zoom-in-frame").mousedown(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                $(".finish-calibration").css("visibility", "visible");
                setClibrationStartTimestamp();
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

    function setClibrationStartTimestamp() {
        if (!calibration_start_timestamp) {
            calibration_start_timestamp = (new Date()).getTime();
        }
    }

    function keepDecreasingInit() {
        var frameEvent = null;
        $(".zoom-out-frame").mousedown(function(e) {
            if (e.which == 1) { // lefy key 1, 2, scroll, 3, right key
                $(".finish-calibration").css("visibility", "visible");
                setClibrationStartTimestamp();
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
        setClibrationStartTimestamp: setClibrationStartTimestamp,
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
    var ref_img = "";
    var ref_img_id = "";
    var distorted_val = 0;
    var distorted_img_id = "";
    var slider_tracking = "";
    var isStart = false;
    
    var dis_imgids = [];

    function init() {
        if (InitImage.ref_img_id != "") {
            $("." + "src-" + InitImage.ref_img_id.split("_")[0]).remove();
        }

        $(".range").focus().attr("max", CustomizedValues.REF_IMG_IDX_MAX);
        var new_img = InitImage.src_img_idx_list_copy.shift();
        genImagelist_obj = genImagelist(new_img);
        InitImage.ref_img = genImagelist_obj["ref_img_url"];
        InitImage.ref_img_id = genImagelist_obj["ref_img_id"];
        InitImage.dis_imgurls = genImagelist_obj["dis_imgurls"];
        InitImage.dis_imgids = genImagelist_obj["dis_imgids"];

        SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];

        InitImage.distorted_img_id = InitImage.ref_img_id;
        InitImage.distorted_val = 0;
        CustomizedValues.bg_img_idx = 0;

        createImageDom(isNextGroup = false, InitImage.ref_img_id
                        , InitImage.ref_img
                        , InitImage.dis_imgids
                        , InitImage.dis_imgurls);

        // getDistortedImage();
    }

    function getDistortedImage() {
        $(".range").on("input", function() { 
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
        });
    }

    function genImagelist(new_img_name) {
        var next_ref_img_id = new_img_name;

        tmp_name_list = next_ref_img_id.split("_") //["Study", "SRC06", "BPG"]
        
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

                var image_dom = "<div class='image-cover src-"
                                + img_id_list[0].split("_")[0] + "' id='" +  img_id_list[i] 
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
        $(".next-image, .range").attr("disabled", false);
        $(".range").focus();
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

    function startExperiment() {
        $(".start-experiment").click(function(event){
            Flickering.init();
            $(".start-experiment-panel").css("display", "none");
            $(".image-panel, .controler-panel").css("display", "inline");
            InitImage.isStart = true;
            SubmitResult.result[InitImage.ref_img] = ["", "", (new Date()).getTime(), ""];
            $(".range").focus();
        });  
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
        startExperiment: startExperiment,
        getDistortedImage: getDistortedImage,

    };
})();

var seeFlickering = (function() {
    var _curr_img_count = 0;

    function init() {
        $(".next-image").click(function(event){
            if ($(".range").attr("hasdrag") == "y") {
                action();
            } else if ($(".range").attr("hasdrag") == "n") {
                alert(CustomizedValues.WARNING_MESSAGE["please-drag"]);
            }
        });
    }

    function action() {
        $(".range").attr("hasdrag", "n");
        InitProgressBar.task_cnt += 1;
        InitProgressBar.increase();

        if (InitImage.ref_img == CustomizedValues.test_image) {
            if(!StoreData.getStorage("acc_record")) {   
                StoreData.setStorage("acc_record", JSON.stringify({"total":0, "passed":0, "failed":0, "acc":0}));
            }
   
            var acc_record = JSON.parse(StoreData.getStorage("acc_record"));
            acc_record["total"] += 1;

            var gt = $(".ground-truth").attr("gtvalue").split("-");
            if (InitImage.distorted_val >= parseInt(gt[0]) && InitImage.distorted_val <= parseInt(gt[1])) {
                CustomizedValues.pass_test = true;
                acc_record["passed"] += 1;
            } else {
                CustomizedValues.pass_test = false;
                acc_record["failed"] += 1;
            }

            acc_record["acc"] = acc_record["passed"] / acc_record["total"];

            StoreData.setStorage("acc_record", JSON.stringify(acc_record));

            if (acc_record["total"] >= CustomizedValues.PASS_TOTAL_THRES && acc_record["acc"]<CustomizedValues.PASS_ACC) {
                StoreData.setStorage("have_qulification", "false");
                $("#failed-modal-text").html(CustomizedValues.WARNING_MESSAGE["lose_qulification"]);
                $("#failed-modal-btn").html("OK");
            }
        }
        
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
            } else {
                clearInterval(Flickering.flicker);
                clearInterval(CheckEnvInBackground.interval);
                $(".range").attr("disabled", true);
                $(".next-image").css("display", "none");

                // increase hit num
                var curr_hit_num = parseInt(StoreData.getStorage("hit_num"));
                curr_hit_num += 1;
                StoreData.setStorage("hit_num", curr_hit_num);

                if (!CustomizedValues.pass_test) {
                    $("#failed-test-modal").modal("show")
                }

                // $(".submit-result").css("display", "inline"); // for development
                // sibmit an string as survey  
                $("input.survey").val(GetSurveyResult.survey_result);


                $(".instruction").css("display", "none");
                $(".distortion-level").css("display", "none");
                $(".range").css("display", "none");
                $(".progress").css("display", "none");

                $(".tips").html("Thank you for your participation! Please submit your HIT result.");

                //for pilot experiment
                if (CustomizedValues.IS_PILOT_EXP) {
                    if (!GetSurveyResult.didSurveyBefore()) {
                        $(".open-survey").css("display", "inline");
                        $(".tips").html("Thank you for your participation!<br> You can take a short survey and get bonus. If you took this survey before, please skip it and submit your HIT result.");
                    }
                }
                


                // save data to AMT dom ;
                $("input.result").val(JSON.stringify(SubmitResult.result));
                $("input.os-info").val(GetEnvInfo.user_os_info);
                $("#submitButton").css("display", "inline");  



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
        $("#instruction-modal").modal("show");
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

    function init() {
        $(".submit-result").click(function(event){
            action();
        });
    }

    function action() {
        $(".submit-result").css("display", "none");
        // $(".tocsv").css("display", "inline");
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

