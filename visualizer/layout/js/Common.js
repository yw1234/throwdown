var layout = {
    bindEvent : function(){
        $("#topo-btn").click(layout.showTopo);
        $("#app-btn").click(layout.showAPP);
    },
    showTopo : function(){
        $("#app-btn").removeClass("active");
        $("#topo-btn").addClass("active");
        $("#app-main").hide();
        $("#topo-main").show();
    },
    showAPP : function(){
        $("#topo-btn").removeClass("active");
        $("#app-btn").addClass("active");
        $("#topo-main").hide();
        $("#app-main").show();
    }
}

/**
 * main fun
 */
$(function(){
    layout.bindEvent();
})