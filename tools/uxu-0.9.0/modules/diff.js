// -*- indent-tabs-mode: t; tab-width: 4 -*-
/**
 * Mainly ported from difflib.py, the standard diff library of Python.
 * This code is distributed under the Python Software Foundation License.
 * Contributor(s): Sutou Kouhei <kou@clear-code.com> (porting)
 *                 SHIMODA Hiroshi <shimoda@clear-code.com> (encoded diff)
 * ------------------------------------------------------------------------
 * Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009
 * Python Software Foundation.
 * All rights reserved.
 *
 * Copyright (c) 2000 BeOpen.com.
 * All rights reserved.
 *
 * Copyright (c) 1995-2001 Corporation for National Research Initiatives.
 * All rights reserved.
 *
 * Copyright (c) 1991-1995 Stichting Mathematisch Centrum.
 * All rights reserved.
 */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Diff', 'ReadableDiffer', 'SequenceMatcher'];

var Diff = {

readable : function(aFrom, aTo, aEncoded)
{
	var differ = new ReadableDiffer(this._splitWithLine(aFrom), this._splitWithLine(aTo));
	return aEncoded ?
		differ.encodedDiff() :
		differ.diff(aEncoded).join("\n") ;
},

foldedReadable : function(aFrom, aTo, aEncoded)
{
	var differ = new ReadableDiffer(this._splitWithLine(this._fold(aFrom)),
									this._splitWithLine(this._fold(aTo)));
	return  aEncoded ?
		differ.encodedDiff() :
		differ.diff(aEncoded).join("\n") ;
},

isInterested : function(aDiff)
{
	if (!aDiff)
		return false;

	if (aDiff.length == 0)
		return false;

	if (!aDiff.match(/^[-+]/mg))
		return false;

	if (aDiff.match(/^[ ?]/mg))
		return true;

	if (aDiff.match(/(?:.*\n){2,}/g))
		return true;

	if (this.needFold(aDiff))
		return true;

	return false;
},

needFold : function(aDiff)
{
	if (!aDiff)
		return false;

	if (aDiff.match(/^[-+].{79}/mg))
		return true;

	return false;
},

_splitWithLine : function(aString)
{
	aString = String(aString);
	return aString.length == 0 ? [] : aString.split(/\r?\n/);
},

_fold : function(aString)
{
	aString = String(aString);
	var foldedLines = aString.split("\n").map(function (aLine) {
		return aLine.replace(/(.{78})/g, "$1\n");
	});
	return foldedLines.join("\n");
}

};


function ReadableDiffer(aFrom, aTo)
{
    this.from = aFrom;
    this.to = aTo;
};

ReadableDiffer.prototype = {

diff : function()
{
    var lines = [];
    var matcher = new SequenceMatcher(this.from, this.to);

    matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var target;

		switch (tag) {
			case "replace":
				target = this._diffLines(fromStart, fromEnd, toStart, toEnd);
				lines = lines.concat(target);
				break;
			case "delete":
				target = this.from.slice(fromStart, fromEnd);
				lines = lines.concat(this._tagDeleted(target));
				break;
			case "insert":
				target = this.to.slice(toStart, toEnd);
				lines = lines.concat(this._tagInserted(target));
				break;
			case "equal":
				target = this.from.slice(fromStart, fromEnd);
				lines = lines.concat(this._tagEqual(target));
				break;
			default:
				throw "unknown tag: " + tag;
				break;
		}
	}, this);

	return lines;
},

encodedDiff : function()
{
    var lines = [];
    var matcher = new SequenceMatcher(this.from, this.to);

    matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var target;

		switch (tag) {
			case "replace":
				target = this._diffLines(fromStart, fromEnd, toStart, toEnd, true);
				lines = lines.concat(target);
				break;
			case "delete":
				target = this.from.slice(fromStart, fromEnd);
				lines = lines.concat(this._tagDeleted(target, true));
				break;
			case "insert":
				target = this.to.slice(toStart, toEnd);
				lines = lines.concat(this._tagInserted(target, true));
				break;
			case "equal":
				target = this.from.slice(fromStart, fromEnd);
				lines = lines.concat(this._tagEqual(target, true));
				break;
			default:
				throw "unknown tag: " + tag;
				break;
		}
	}, this);

	var blocks = [];
	var lastBlock = '';
	var lastLineType = '';
	lines.forEach(function(aLine) {
		var lineType = aLine.match(/^<span class="line ([^" ]+)/)[1];
		if (lineType != lastLineType) {
			blocks.push(lastBlock + (lastBlock ? '</span>' : '' ));
			lastBlock = '<span class="block '+lineType+'">';
			lastLineType = lineType;
		}
		lastBlock += aLine;
	}, this);
	if (lastBlock) blocks.push(lastBlock + '</span>');

	return blocks.join('');
},

_tagLine : function(aMark, aContents)
{
	return aContents.map(function (aContent) {
		return aMark + ' ' + aContent;
	}, this);
},

_encodedTagLine : function(aEncodedClass, aContents)
{
	return aContents.map(function (aContent) {
		return '<span class="line '+aEncodedClass+'">'+
				this._escapeForEncoded(aContent)+
				'</span>';
	}, this);
},

_escapeForEncoded : function(aString)
{
	return aString
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
},

_tagDeleted : function(aContents, aEncoded)
{
	return aEncoded ?
			this._encodedTagLine('deleted', aContents) :
			this._tagLine('-', aContents);
},

_tagInserted : function(aContents, aEncoded)
{
	return aEncoded ?
			this._encodedTagLine('inserted', aContents) :
			this._tagLine('+', aContents);
},

_tagEqual : function(aContents, aEncoded)
{
	return aEncoded ?
			this._encodedTagLine('equal', aContents) :
			this._tagLine(' ', aContents);
},

_tagDifference : function(aContents, aEncoded)
{
	return aEncoded ?
			this._encodedTagLine('difference', aContents) :
			this._tagLine('?', aContents);
},

_findDiffLineInfo : function(aFromStart, aFromEnd, aToStart, aToEnd)
{
	var bestRatio = 0.74;
	var fromEqualIndex, toEqualIndex;
	var fromBestIndex, toBestIndex;
	var toIndex;

	for (toIndex = aToStart; toIndex < aToEnd; toIndex++) {
		var fromIndex;
		for (fromIndex = aFromStart; fromIndex < aFromEnd; fromIndex++) {
			var matcher;

			if (this.from[fromIndex] == this.to[toIndex]) {
				if (fromEqualIndex === undefined)
					fromEqualIndex = fromIndex;
				if (toEqualIndex === undefined)
					toEqualIndex = toIndex;
				continue;
			}

			matcher = new SequenceMatcher(this.from[fromIndex],
										  this.to[toIndex],
										  this._isSpaceCharacter);
			if (matcher.ratio() > bestRatio) {
                bestRatio = matcher.ratio();
                fromBestIndex = fromIndex;
                toBestIndex = toIndex;
			}
		}
	}

	return [bestRatio,
			fromEqualIndex, toEqualIndex,
			fromBestIndex, toBestIndex];
},

_diffLines : function(aFromStart, aFromEnd, aToStart, aToEnd, aEncoded)
{
	var cutOff = 0.75;
	var info = this._findDiffLineInfo(aFromStart, aFromEnd, aToStart, aToEnd);
	var bestRatio = info[0];
	var fromEqualIndex = info[1];
	var toEqualIndex = info[2];
	var fromBestIndex = info[3];
	var toBestIndex = info[4];

	if (bestRatio < cutOff) {
		if (fromEqualIndex === undefined) {
			var taggedFrom, taggedTo;

			taggedFrom = this._tagDeleted(this.from.slice(aFromStart, aFromEnd), aEncoded);
			taggedTo = this._tagInserted(this.to.slice(aToStart, aToEnd), aEncoded);
			if (aToEnd - aToStart < aFromEnd - aFromStart)
                return taggedTo.concat(taggedFrom);
			else
                return taggedFrom.concat(taggedTo);
		}

		fromBestIndex = fromEqualIndex;
		toBestIndex = toEqualIndex;
		bestRatio = 1.0;
	}

	return [].concat(
		this.__diffLines(aFromStart, fromBestIndex,
						 aToStart, toBestIndex,
						 aEncoded),
		(aEncoded ?
			this._diffLineEncoded(this.from[fromBestIndex],
								  this.to[toBestIndex]) :
			this._diffLine(this.from[fromBestIndex],
							this.to[toBestIndex])
		),
		this.__diffLines(fromBestIndex + 1, aFromEnd,
						 toBestIndex + 1, aToEnd,
						 aEncoded)
	);
},

__diffLines : function(aFromStart, aFromEnd, aToStart, aToEnd, aEncoded)
{
	if (aFromStart < aFromEnd) {
		if (aToStart < aToEnd) {
			return this._diffLines(aFromStart, aFromEnd, aToStart, aToEnd, aEncoded);
		} else {
			return this._tagDeleted(this.from.slice(aFromStart, aFromEnd), aEncoded);
		}
	} else {
		return this._tagInserted(this.to.slice(aToStart, aToEnd), aEncoded);
	}
},

_diffLineEncoded : function(aFromLine, aToLine)
{
	var fromChars = aFromLine.split('');
	var toChars = aToLine.split('');
	var matcher = new SequenceMatcher(aFromLine, aToLine,
									  this._isSpaceCharacter);
	var phrases = [];
	matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var fromPhrase = fromChars.slice(fromStart, fromEnd).join('');
		var toPhrase = toChars.slice(toStart, toEnd).join('');
		switch (tag) {
			case "replace":
			case "delete":
			case "insert":
			case "equal":
				phrases.push({ tag         : tag,
				               from        : fromPhrase,
				               encodedFrom : this._escapeForEncoded(fromPhrase),
				               to          : toPhrase,
				               encodedTo   : this._escapeForEncoded(toPhrase), });
				break;
			default:
				throw "unknown tag: " + tag;
		}
	}, this);

	var encodedPhrases = [];
	var current;
	var replaced = 0;
	var inserted = 0;
	var deleted = 0;
	for (var i = 0, maxi = phrases.length; i < maxi; i++)
	{
		current = phrases[i];
		switch (current.tag) {
			case "replace":
				encodedPhrases.push('<span class="phrase replaced">');
				encodedPhrases.push(this._encodedTagPhrase('deleted', current.encodedFrom));
				encodedPhrases.push(this._encodedTagPhrase('inserted', current.encodedTo));
				encodedPhrases.push('</span>');
				replaced++;
				break;
			case "delete":
				encodedPhrases.push(this._encodedTagPhrase('deleted', current.encodedFrom));
				deleted++;
				break;
			case "insert":
				encodedPhrases.push(this._encodedTagPhrase('inserted', current.encodedTo));
				inserted++;
				break;
			case "equal":
				// •ÏX“_‚ÌŠÔ‚É‹²‚Ü‚ê‚½1•¶Žš‚¾‚¯‚Ì–³•ÏX•”•ª‚¾‚¯‚Í“Á•Êˆµ‚¢
				if (
					current.from.length == 1 &&
					(i > 0 && phrases[i-1].tag != 'equal') &&
					(i < maxi-1 && phrases[i+1].tag != 'equal')
					) {
					encodedPhrases.push('<span class="phrase equal">');
					encodedPhrases.push(this._encodedTagPhrase('duplicated', current.encodedFrom));
					encodedPhrases.push(this._encodedTagPhrase('duplicated', current.encodedTo));
					encodedPhrases.push('</span>');
				}
				else {
					encodedPhrases.push(current.encodedFrom);
				}
				break;
		}
	}

	var extraClass = (replaced || (deleted && inserted)) ?
			' includes-both-modification' :
			'' ;

	return [
		'<span class="line replaced'+extraClass+'">'+
		encodedPhrases.join('')+
		'</span>'
	];
},

_encodedTagPhrase : function(aEncodedClass, aContent)
{
	return '<span class="phrase '+aEncodedClass+'">'+aContent+'</span>';
},

_diffLine : function(aFromLine, aToLine)
{
	var fromTags = "";
	var toTags = "";
	var matcher = new SequenceMatcher(aFromLine, aToLine,
									  this._isSpaceCharacter);

	matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var fromLength, toLength;

		fromLength = fromEnd - fromStart;
		toLength = toEnd - toStart;
		switch (tag) {
			case "replace":
				fromTags += this._repeat("^", fromLength);
				toTags += this._repeat("^", toLength);
				break;
			case "delete":
            	fromTags += this._repeat("-", fromLength);
				break;
			case "insert":
            	toTags += this._repeat("+", toLength);
				break;
			case "equal":
				fromTags += this._repeat(" ", fromLength);
				toTags += this._repeat(" ", toLength);
				break;
            default:
				throw "unknown tag: " + tag;
				break;
		}
	}, this);

	return this._formatDiffPoint(aFromLine, aToLine, fromTags, toTags);
},

_formatDiffPoint : function(aFromLine, aToLine, aFromTags, aToTags)
{
	var common;
	var result;
	var fromTags, toTags;

	common = Math.min(this._nLeadingCharacters(aFromLine, "\t"),
					  this._nLeadingCharacters(aToLine, "\t"));
	common = Math.min(common,
					  this._nLeadingCharacters(aFromTags.substr(0, common),
											   " "));
	fromTags = aFromTags.substr(common).replace(/\s*$/, '');
	toTags = aToTags.substr(common).replace(/\s*$/, '');

	result = this._tagDeleted([aFromLine]);
	if (fromTags.length > 0) {
		fromTags = this._repeat("\t", common) + fromTags;
		result = result.concat(this._tagDifference([fromTags]));
	}
	result = result.concat(this._tagInserted([aToLine]));
	if (toTags.length > 0) {
		toTags = this._repeat("\t", common) + toTags;
		result = result.concat(this._tagDifference([toTags]));
	}

	return result;
},

_nLeadingCharacters : function(aString, aCharacter)
{
	var n = 0;
	while (aString[n] == aCharacter) {
		n++;
	}
	return n;
},

_isSpaceCharacter : function(aCharacter)
{
	return aCharacter == " " || aCharacter == "\t";
},

_repeat : function(aString, n)
{
	var result = "";

	for (; n > 0; n--) {
		result += aString;
	}

	return result;
}

};




function SequenceMatcher(aFrom, aTo, aJunkPredicate)
{
    this.from = aFrom;
    this.to = aTo;
    this.junkPredicate = aJunkPredicate;
    this._updateToIndexes();
}

SequenceMatcher.prototype = {

longestMatch : function(aFromStart, aFromEnd, aToStart, aToEnd)
{
    var bestInfo, haveJunk = false;

    bestInfo = this._findBestMatchPosition(aFromStart, aFromEnd,
                                           aToStart, aToEnd);
    for (var x in this.junks) {
        haveJunk = true;
        break;
    }

    if (haveJunk) {
        var adjust = this._adjustBestInfoWithJunkPredicate;
        var args = [aFromStart, aFromEnd, aToStart, aToEnd];

        bestInfo = adjust.apply(this, [false, bestInfo].concat(args));
        bestInfo = adjust.apply(this, [true, bestInfo].concat(args));
    }

    return bestInfo;
},

matches : function() {
    if (!this._matches)
        this._matches = this._computeMatches();
    return this._matches;
},

blocks : function() {
    if (!this._blocks)
        this._blocks = this._computeBlocks();
    return this._blocks;
},

operations : function() {
    if (!this._operations)
        this._operations = this._computeOperations();
    return this._operations;
},

groupedOperations : function(aContextSize)
{
	var _this = this;
	var _operations;
	var groupWindow, groups, group;

	if (!aContextSize)
		aContextSize = 3;

	_operations = this.operations();
	if (_operations.length == 0)
		_operations = [["equal", 0, 0, 0, 0]];
	_operations = this._expandEdgeEqualOperations(_operations, aContextSize);

	groupWindow = aContextSize * 2;
	groups = [];
	group = [];
	_operations.forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];

		if (tag == "equal" && fromEnd - fromStart > groupWindow) {
			group.push([tag,
                        fromStart,
                        Math.min(fromEnd, fromStart + aContextSize),
                        toStart,
                        Math.min(toEnd, toStart + aContextSize)]);
			groups.push(group);
			group = [];
			fromStart = Math.max(fromStart, fromEnd - aContextSize);
			toStart = Math.max(toStart, toEnd - aContextSize);
		}
		group.push([tag, fromStart, fromEnd, toStart, toEnd]);
	});

	if (group.length > 0)
		groups.push(group);

	return groups;
},

ratio : function() {
    if (!this._ratio)
        this._ratio = this._computeRatio();
    return this._ratio;
},

_updateToIndexes : function()
{
    var i, length;

    this.toIndexes = {};
    this.junks = {};

    length = this.to.length;
    for (i = 0; i < length; i++) {
        var item = this.to[i];

        if (!this.toIndexes[item])
            this.toIndexes[item] = [];
        this.toIndexes[item].push(i);
    }

    if (!this.junkPredicate)
        return;

    var item;
    var toIndexesWithoutJunk = {};
    for (item in this.toIndexes) {
        if (this.junkPredicate(item)) {
            this.junks[item] = true;
        } else {
            toIndexesWithoutJunk[item] = this.toIndexes[item];
        }
    }
    this.toIndexes = toIndexesWithoutJunk;
},

_findBestMatchPosition : function(aFromStart, aFromEnd, aToStart, aToEnd)
{
    var bestFrom = aFromStart;
    var bestTo = aToStart;
    var bestSize = 0;
    var sizes = {};
    var fromIndex;

    for (fromIndex = aFromStart; fromIndex <= aFromEnd; fromIndex++) {
        var _sizes = {};
        var i, length;
        var toIndexes;

        toIndexes = this.toIndexes[this.from[fromIndex]] || [];
        length = toIndexes.length;
        for (i = 0; i < length; i++) {
            var size;
            var toIndex = toIndexes[i];

            if (toIndex < aToStart)
                continue;
            if (toIndex > aToEnd)
                break;

            size = _sizes[toIndex] = (sizes[toIndex - 1] || 0) + 1;
            if (size > bestSize) {
                bestFrom = fromIndex - size + 1;
                bestTo = toIndex - size + 1;
                bestSize = size;
            }
        }
        sizes = _sizes;
    }

    return [bestFrom, bestTo, bestSize];
},

_adjustBestInfoWithJunkPredicate : function(aShouldJunk, aBestInfo,
                                            aFromStart, aFromEnd,
                                            aToStart, aToEnd)
{
    var bestFrom, bestTo, bestSize;

    bestFrom = aBestInfo[0];
    bestTo = aBestInfo[1];
    bestSize = aBestInfo[2];

    while (bestFrom > aFromStart &&
           bestTo > aToStart &&
           (aShouldJunk ?
            this.junks[this.to[bestTo - 1]] :
            !this.junks[this.to[bestTo - 1]]) &&
           this.from[bestFrom - 1] == this.to[bestTo - 1]) {
        bestFrom -= 1;
        bestTo -= 1;
        bestSize += 1;
    }

    while (bestFrom + bestSize < aFromEnd &&
           bestTo + bestSize < aToEnd &&
           (aShouldJunk ?
            this.junks[this.to[bestTo + bestSize]] :
            !this.junks[this.to[bestTo + bestSize]]) &&
           this.from[bestFrom + bestSize] == this.to[bestTo + bestSize]) {
        bestSize += 1;
    }

    return [bestFrom, bestTo, bestSize];
},

_computeMatches : function()
{
    var _matches = [];
    var queue = [[0, this.from.length, 0, this.to.length]];

    while (queue.length > 0) {
        var target = queue.pop();
        var fromStart = target[0];
        var fromEnd = target[1];
        var toStart = target[2];
        var toEnd = target[3];
        var match, matchFromIndex, matchToIndex, size;

        match = this.longestMatch(fromStart, fromEnd - 1, toStart, toEnd - 1);
        matchFromIndex = match[0];
        matchToIndex = match[1];
        size = match[2];
        if (size > 0) {
            if (fromStart < matchFromIndex && toStart < matchToIndex)
                queue.push([fromStart, matchFromIndex, toStart, matchToIndex]);

            _matches.push(match);
            if (matchFromIndex + size < fromEnd && matchToIndex + size < toEnd)
                queue.push([matchFromIndex + size, fromEnd,
                            matchToIndex + size, toEnd]);
        }
    }

    _matches.sort(function (aMatchInfo1, aMatchInfo2) {
		var fromIndex1 = aMatchInfo1[0];
		var fromIndex2 = aMatchInfo2[0];
		return fromIndex1 - fromIndex2;
	});
    return _matches;
},

_computeBlocks : function()
{
    var _blocks = [];
    var currentFromIndex = 0;
    var currentToIndex = 0;
    var currentSize = 0;

    this.matches().forEach(function (aMatch) {
		var fromIndex = aMatch[0];
		var toIndex = aMatch[1];
		var size = aMatch[2];

		if (currentFromIndex + currentSize == fromIndex &&
			currentToIndex + currentSize == toIndex) {
			currentSize += size;
		} else {
			if (currentSize > 0)
				_blocks.push([currentFromIndex, currentToIndex, currentSize]);
			currentFromIndex = fromIndex;
			currentToIndex = toIndex;
			currentSize = size;
		}
    });

	if (currentSize > 0)
		_blocks.push([currentFromIndex, currentToIndex, currentSize]);

    _blocks.push([this.from.length, this.to.length, 0]);
    return _blocks;
},

_computeOperations : function()
{
	var fromIndex = 0;
	var toIndex = 0;
	var _operations = [];

	var _this = this;
	this.blocks().forEach(function (aBlock) {
		var matchFromIndex = aBlock[0];
		var matchToIndex = aBlock[1];
		var size = aBlock[2];
		var tag;

		tag = _this._determineTag(fromIndex, toIndex,
								  matchFromIndex, matchToIndex);
		if (tag != "equal")
			_operations.push([tag,
							  fromIndex, matchFromIndex,
							  toIndex, matchToIndex]);

		fromIndex = matchFromIndex + size;
		toIndex = matchToIndex + size;

		if (size > 0)
			_operations.push(["equal",
							  matchFromIndex, fromIndex,
							  matchToIndex, toIndex]);
	});

	return _operations;
},

_determineTag : function(aFromIndex, aToIndex,
                         aMatchFromIndex, aMatchToIndex)
{
	if (aFromIndex < aMatchFromIndex && aToIndex < aMatchToIndex) {
		return "replace";
	} else if (aFromIndex < aMatchFromIndex) {
		return "delete";
	} else if (aToIndex < aMatchToIndex) {
		return "insert";
	} else {
		return "equal";
	}
},

_expandEdgeEqualOperations : function(aOperations, aContextSize)
{
	var _operations = [];

	var _this = this;
	aOperations.forEach(function (aOperation, aIndex) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];

		if (tag == "equal" && aIndex == 0) {
			_operations.push([tag,
							  Math.max(fromStart, fromEnd - aContextSize),
                              fromEnd,
                              Math.max(toStart, toEnd - aContextSize),
                              toEnd]);
		} else if (tag == "equal" && aIndex == aOperations.length - 1) {
			_operations.push([tag,
							  fromStart,
							  Math.min(fromEnd, fromStart + aContextSize),
							  toStart,
                              Math.min(toEnd, toStart + aContextSize),
                              toEnd]);
		} else {
			_operations.push(aOperation);
		}
	});

	return _operations;
},

_computeRatio : function()
{
	var length = this.from.length + this.to.length;

	if (length == 0)
		return 1.0;

	var _matches = 0;
	this.blocks().forEach(function (aBlock) {
		var size = aBlock[2];
		_matches += size;
	});
	return 2.0 * _matches / length;
}

};
