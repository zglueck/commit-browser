var cb = {};

cb.commits = [];

cb.retrieveResults = function () {
    // check for valid input
    var org = document.getElementById('org').value;
    if (!org) {
        alert("Please provide an organization name.");
        return;
    }
    var repo = document.getElementById('repo').value;
    if (!repo) {
        alert("Please provide a repository name.");
        return;
    }
    var user = document.getElementById('user').value;
    if (!user) {
        alert("Please provide a user name.");
        return;
    }

    // clear existing results
    cb.commits = [];

    cb.retrieveResults = true;

    cb.queryGitHubApi('https://api.github.com/repos/' + org + '/' + repo + '/commits?author=' + user + 'since=2017-01-01T00:00:00Z');
};

cb.queryGitHubApi = function (url) {

    var xhr = new XMLHttpRequest();
    cb.activeRequests++;
    xhr.addEventListener('load', function () {

        if (xhr.status == 200) {
        
            cb.rateLimit = xhr.getResponseHeader('X-RateLimit-Limit');
            cb.rateRemaining = xhr.getResponseHeader('X-RateLimit-Remaining');
        
            // retrieve the next page of results
            var link = xhr.getResponseHeader('Link');
            if (link) {
                var nextUrl = cb.determineNextPage(link);
                if (nextUrl) {
                    cb.queryGitHubApi(nextUrl);
                }
            }
        
            // add the results to our current commit array
            var retrievedCommits = JSON.parse(xhr.response);
            for (var i = 0, len = retrievedCommits.length; i < len; i++) {
                cb.commits.push(retrievedCommits[i]);
            }

        } else {
            alert("Something went wrong!!! " + xhr.status + "\n" + xhr.body);
        }

        cb.cleanUpResults();
        cb.populateTable();
    });
    xhr.open('GET', url);
    xhr.send();
};

cb.determineNextPage = function (linkHeader) {
    if (!linkHeader) {
        return null;
    }

    var pages = linkHeader.split(',');

    for (var i = 0, len = pages.length; i < len; i++) {
        var link = pages[i];
        if (link.endsWith('\"next\"')) {
            var url = link.split(";")[0];
            // remove the leading and trailing carrots
            url = url.substring(1, url.length - 1);
            return url;
        }
    }

    return null;
};

cb.cleanUpResults = function () {
    if (cb.commits && cb.commits.length > 0) {
        cb.commits.sort(function (a, b) {
            var aDate = new Date(a.commit.author.date);
            var bDate = new Date(b.commit.author.date);
            
            return aDate.valueOf() - bDate.valueOf();
        });
    }
};

cb.populateTable = function () {
    // usage stats
    document.getElementById('rateLimit').innerText = cb.rateLimit;
    document.getElementById('remainingRequests').innerText = cb.rateRemaining;

    // clear the existing table
    var commitsTable = document.getElementById('commitsTable');
    commitsTable.innerHTML = "";

    // populate the table
    for (var i = 0, len = cb.commits.length; i < len; i++) {
        var commit = cb.commits[i];
        var tdDate = document.createElement('td');
        tdDate.innerText = commit.commit.author.date;
        var tdMessage = document.createElement('td');
        tdMessage.innerText = commit.commit.message;
        var tr = document.createElement('tr');
        tr.appendChild(tdDate);
        tr.appendChild(tdMessage);
        commitsTable.appendChild(tr);
    }
};

window.addEventListener('load', function () {
    // register the search button
    var searchButton = document.getElementById('retrieve');
    searchButton.addEventListener('click', cb.retrieveResults);
});
