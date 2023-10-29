(function(win){

    var COMPLETION_URL = "/api/v1/llm/completion";

  

    function LLM_Request(promptId, tokens){
        this.promptId = promptId;
        this.tokens = tokens;
        console.log("LLM_Request: ", this.promptId, this.tokens);
    }

    LLM_Request.prototype = {
        start: function(){
            // fire ajax call to COMPLETION_URL
            var self = this;
            var data = {
                promptId: self.promptId,
                tokens: self.tokens
            };
            $.ajax({
                url: COMPLETION_URL,
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json;charset=UTF-8",
                success: function(response, status, xhr) {
                    self.onSuccess(response, status, xhr);
                },
                error: function(xhr, statusText, error) {
                    console.log("LLM_Request: error: ", statusText);
                    self.onError(statusText);
                }
            });
        },
        onSuccess: function(response, status, xhr){
            console.log(`LLM_Request: ${this.promptId} onSuccess: `, response)
            // get response header's location attribute
            this.check_times = 0;
            this.chk_status_url = xhr.getResponseHeader("location");
            this.chkLLMStatus()
        },
        onError: function(error){
            console.error(`LLM_Request: ${this.promptId} onError: `, error)
        },
        fetchAIContent: function(){
            var content_url = this.chk_status_url.replace("/state", "");
            // fetch the content from content_url
            var self = this;
            $.ajax({
                url: content_url,
                type: "GET",
                success: function(response, status, xhr) {
                    self.onFetchSuccess(response, status, xhr);
                },
                error: function(xhr, statusText, error) {
                    self.onFetchError(statusText);
                }
            });
        },
        onFetchSuccess: function(response, status, xhr){
            console.log(`LLM_Request: ${this.promptId} onFetchSuccess: `, response)
            Toastify({
                text: response.content,
                duration: -1,
                close: true
              }).showToast()
        },
        onFetchError: function(){
            console.error(`LLM_Request: ${this.promptId} onFetchError: `, error)
        },
        chkLLMStatus: function(){
            // fire ajax call to chk_status_url
            // check the response sstatus if it is COMPLETE then done
            // otherwise, wait for 1 second and check again
            // the maximum check time is 20
            var self = this;
            $.ajax({
                url: self.chk_status_url,
                type: "GET",
                success: function(response, status, xhr) {
                    if (response.status == "COMPLETE"){
                        self.fetchAIContent();
                        return;
                    }
                    // wait 1 second and check again
                    self.check_times += 1;
                    if (self.check_times > 3){
                        self.onChkError("Timeout");
                        return;
                    }
                    setTimeout(function(){
                        self.chkLLMStatus();
                    }, 1000);
                },
                error: function(xhr, statusText, error) {
                    console.log("LLM_Request: error: ", statusText);
                    self.onChkError(statusText);
                }
            });
        },
        onChkError: function(error){
            console.error(`LLM_Request: ${this.promptId} onChkError: `, error)
        }
    }



    function LLM_Steward(){
        this.init();
    }

    LLM_Steward.prototype = {
        init: function(){
            this.llm_requests = [];
            this.initEvent();
        },
        initEvent: function(){
        },
        add: function(promptId, tokens){
            var llm_request = new LLM_Request(promptId, tokens);
            this.llm_requests.push(llm_request);
            llm_request.start()
        }
    }

    if (!window.__llm_steward) {
        window.__llm_steward = new LLM_Steward();
    }

})(window)
