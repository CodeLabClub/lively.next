<style>
.test {
}
</style>


# lively.lang [![Build Status](https://travis-ci.org/LivelyKernel/lively.lang.svg?branch=master)](https://travis-ci.org/LivelyKernel/lively.lang)

*What?* This project packages abstractions for JavaScript that proved to be useful in
the [Lively Web](http://lively-web.org) project. On first glance it might seem
to be just another underscore.js library but apart from extensions to existing
JavaScript objects and classes it also provides abstractions for asynchronous
code, new object representations, and functions for inspecting JavaScript
objects.

*Why?* Make it easy to reuse abstractions we found helpful in all kinds of
contexts. All features can be used in browser environments and in node.js.
Actually, one motivation for this library was to have unified interfaces across
JavaScript environments.

*How?* By default the library is non-invasive, i.e. no global objects are
modified. To use provided functions you can either

1. call them directly,
2. use underscore.js-like chain/value wrapping,
3. or install extension methods explicitly in global objects.

## Summary

JavaScript objects and classes that are extended:

- Array
- String
- Number
- Object
- Function
- Date

Abstractions usually not included by default in JavaScript runtimes:

- node.js-like event emitter interface (uses event module on node.js)
- Path (property access in nested objects / arrays)
- Interval
- Grid
- ArrayProjection
- Closure
- Messengers (generic interface for remote-messaging)
- Workers based on the messenger interface


## "Installation"
TODO

### Browsers
TODO

### node.js
TODO


## Usage
TODO


## API

<!---API_GENERATED_START--->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file string.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

### string

 String utility methods for printing, parsing, and converting strings

#### string.format()

 Takes a variable number of arguments. The first argument is the format
 string. Placeholders in the format string are marked with `"%s"`.
 Example:

```js
jsext.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
```

#### string.withDecimalPrecision(str, precision)

 Example:

```js
string.withDecimalPrecision("1.12345678", 3) // => "1.123"
```

#### string.indent(str, indentString, depth)

 Example:

```js
string.indent("Hello", "  ", 2) // => "    Hello"
```

#### string.removeSurroundingWhitespaces(str)

 Example:

```js
string.removeSurroundingWhitespaces("  hello\n  world  ") // => "hello\nworld"
```

#### string.print(obj)

 Example:

```js
string.print([[1,2,3], "string", {foo: 23}])
// => [[1,2,3],"string",[object Object]]
```

#### string.paragraphs(string, options)

 string.paragraphs('foo\n\nbar')
 string.paragraphs('foo\n\n\n\n\nbar', {keepEmptyLines: true})

#### string.tokens(str, regex)

 string.tokens(' a b c')
 => ['a', 'b', 'c']

#### string.tableize(s, options)

 string => array
 string.tableize('a b c\nd e f')
   => [[a, b, c], [d, e, f]]
 can also parse csv like
 csv = '"Symbol","Name","LastSale",\n'
   + '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
   + '"FCTY","1st Century Bancshares, Inc","5.65",'
 csvTable = string.tableize(companiesCSV, /^\s*"|","|",?\s*$/g)

#### string.printTable(tableArray, options)

 array => string
 string.printTable([[a, b, c], [d, e, f]]) => 'a b c\nd e f'

#### string.newUUID()

 copied from Martin's UUID class

#### string.unescapeCharacterEntities(s)

 like &uml;

#### string.createDataURI(content, mimeType)

 window.open(string.createDataURI('<h1>test</h1>', 'text/html'));

#### string.md5(string)

 http://www.myersdaily.org/joseph/javascript/md5-text.html

#### string.md5(string)

 there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 

#### string.md5(string)

 this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  

#### string.md5(string)

 mr 2014-03-10: FIXME! No matter what, add32 is always the one inside the if body (ECMA spec!)
 function add32(a, b) {
  return (a + b) & 0xFFFFFFFF;
 }

 if (hex(md51("hello")) != "5d41402abc4b2a76b9719d911017c592") {

#### string.md5(string)

 }

#### string.stringMatch(s, patternString, options)

 example: string.stringMatch("foo 123 bar", "foo __/[0-9]+/__ bar")
 returns {matched: true} if success otherwise
 {matched: false, error: EXPLANATION, pattern: STRING|RE, pos: NUMBER}

#### string.lineIndexComputer(s)

 returns a function that will accept a character position and return
 its line number in string. If the char pos is outside of the line
 ranges -1 is returned
 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 line ranges: list of numbers, each line has two entries:
 i -> start of line, i+1 -> end of line

#### string.lineIndexComputer(s)

 FIXME, this is O(n). Make cumputation more efficient, binary lookup?

#### string.regExpEscape(s)

from google' closure library

#### string.hashCode(s)

 http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file number.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

#### num.random(min, max)

 both min and max are included

#### num.between(x, a, b, eps)

 is a <= x <= y?

#### num.parseLength(string, toUnit)

 num.parseLength('3cm')
 This converts the length value to pixels or the specified toUnit.
 Supported units are: mm, cm, in, px, pt, pc

#### num.roundTo(n, quantum)

 quantum is something like 0.01,
 however for JS rounding to work we need the reciprocal

#### num.detent(n, detent, grid, snap)

 Map all values that are within detent/2 of any multiple of grid to
 that multiple. Otherwise, if snap is true, return self, meaning that
 the values in the dead zone will never be returned. If snap is
 false, then expand the range between dead zone so that it covers the
 range between multiples of the grid, and scale the value by that
 factor.

#### num.detent(n, detent, grid, snap)

 Nearest multiple of grid

#### num.detent(n, detent, grid, snap)

 Snap to that multiple...

#### num.detent(n, detent, grid, snap)

 ...and return n
 or compute nearest end of dead zone

#### num.detent(n, detent, grid, snap)

 and scale values between dead zones to fill range between multiples

<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file date.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->



<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file collection.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

### arrNative

 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 pure JS implementations of native Array methods
 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

### grid

 Global.Arrays = {
   equal: function(firstArray, secondArray) {
     // deprecated, use anArray.equals
     return firstArray.equals(secondArray);
   }
 }

### interval

 Intervals are arrays whose first two elements are numbers and the
 first element should be less or equal the second element, see
 #isInterval

#### arrNative.map(iterator, context)

 if (typeof iterator !== 'function')
 throw new TypeError(arguments[0] + ' is not a function');

#### arr.reMatches(arr, re, stringifier)

 convert each element in arr into a string and apply re to match it.
 result might include null items if re did not match (usful for masking)
 Example:

```js
var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
morphs.mask(morphs.reMatches(/code/i))
```

#### arr.mutableCompact(arr)

 fix gaps that were created with 'delete'

#### arr.uniqBy(arr, comparator, context)

 comparator(a,b) returns BOOL. True if a and be should be regarded
 equal, false otherwise

#### arr.nestedDelay(arr, iterator, waitSecs, endFunc, context, optSynchronChunks)

 calls iterator for every element in arr and waits between iterator
 calls waitSecs. eventually endFunc is called. When passing a number n
 as optSynchronChunks, only every nth iteration is delayed

#### arr.doAndContinue(arr, iterator, endFunc, context)

 iterates over arr but instead of consecutively calling iterator,
 iterator gets passed in the invocation for the next iteration step
 as a function as first parameter. This allows to wait arbitrarily
 between operation steps, great for synchronous dependent steps

#### arr.forEachShowingProgress()

 init args

#### arr.forEachShowingProgress()

 init progressbar

#### arr.forEachShowingProgress()

 nest functions so that the iterator calls the next after a delay

#### arr.batchify(arr, constrainedFunc, context)

 takes elements and fits them into subarrays (=batches) so that for
 each batch constrainedFunc returns true. Note that contrained func
 should at least produce 1-length batches, otherwise an error is raised
 see [$world.browseCode("lively.lang.tests.ExtensionTests.ArrayTest", "testBatchify", "lively.lang.tests.ExtensionTests")]
 for an example

#### arr.mask(arr, mask)

 select every element in arr for which arr's element is truthy
 Example:

```js
[1,2,3].mask([false, true, false]) => [2]
```

#### grid.toObjects(grid)

 the first row of the grid defines the propNames
 for each following row create a new object with those porperties
 mapped to the cells of the row as values
 Grid.toObjects([['a', 'b'],[1,2],[3,4]])
   --> [{a:1,b:2},{a:3,b:4}]

#### grid.tableFromObjects(objects, valueForUndefined)

 reverse of grid.toObjects
 useful to convert objectified SQL resultset into table that can be
 printed via Strings.printTable. objects are key/values like [{x:1,y:2},{x:3},{z:4}]
 interpret the keys as column names and add ea objects values as cell
 values of a new row. For the example object this would create the
 table: [["x","y","z"],[1,2,null],[3,null,null],[null,null,4]]

#### interval.compare(a, b)

 we assume that a[0] <= a[1] and b[0] <= b[1]
 -3: a < b and non-overlapping, e.g [1,2] and [3,4]
 -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
 -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
  0: a = b, e.g. [1,2] and [1,2]
  1: a > b and overlapping, e.g. [2,4] and [1,3]
  2: a > b and share border, e.g [1,4] and [0,1]
  3: a > b and non-overlapping, e.g [2,4] and [0,1]

#### interval.compare(a, b)

 we know a[0] > b[0], 1 || 2 || 3

#### interval.coalesce(interval1, interval2, optMergeCallback)

 turns two arrays into one iff compare(interval1, interval2) ∈ [-2, -1,0,1, 2]
 otherwise returns null
 optionally uses merge function
 [1,4], [5,7] => null
 [1,2], [1,2] => [1,2]
 [1,4], [3,6] => [1,6]
 [3,6], [4,5] => [3,6]

#### interval.coalesce(interval1, interval2, optMergeCallback)

 swap

#### interval.coalesceOverlapping(intervals, mergeFunc)

 accepts an array of intervals
 [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]

#### interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)


      * merges and iterates through sorted intervals. Will "fill up" intervals, example:
      Strings.print(interval.intervalsInRangeDo(
              2, 10, [[0, 1], [5,8], [2,4]],
              function(i, isNew) { i.push(isNew); return i; }));
      *  => "[[2,4,false],[4,5,true],[5,8,false],[8,10,true]]"
      * this is currently used for computing text chunks in lively.morphic.TextCore
      

#### interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)

 need to be sorted for the algorithm below

#### interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)

 merged intervals are already sorted, simply "negate" the interval array;

#### interval.intervalsInbetween(start, end, intervals)

 computes "free" intervals between the intervals given in range start - end
 currently used for computing text chunks in lively.morphic.TextCore
 start = 0, end = 10, intervals = [[1,4], [5,8]]
 => [[0,1], [4, 5], [8, 10]]

#### interval.mapToMatchingIndexes(intervals, intervalsToFind)

 returns an array of indexes of the items in intervals that match
 items in intervalsToFind
 Note: we expect intervals and intervals to be sorted according to interval.compare!
 This is the optimized version of:
 return intervalsToFind.collect(function findOne(toFind) {
    var startIdx, endIdx;
    var start = intervals.detect(function(ea, i) {
       startIdx = i; return ea[0] === toFind[0]; });
    if (start === undefined) return [];
    var end = intervals.detect(function(ea, i) {
       endIdx = i; return ea[1] === toFind[1]; });
    if (end === undefined) return [];
    return Array.range(startIdx, endIdx);
 });

#### interval.benchmark()

 Used for developing the code above. If you change the code, please
 make sure that you don't worsen the performance!
 See also lively.lang.tests.ExtensionTests.IntervallTest

<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file function.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

#### fun.argumentNames(f)

 it's a class...

#### fun.extractBody(func)

 returns the body of func as string, removing outer function code and
 superflous indent

#### fun.throttle(func, wait)

 exec func at most once every wait ms even when called more often
 useful to calm down eagerly running updaters and such

#### fun.throttle(func, wait)

 Example:

```js
var i = 0;
x = fun.throttle(function() { show(++i + '-' + Date.now()) }, 500);
Array.range(0,100).forEach(function(n) { x() });

```

#### fun.debounce(wait, func, immediate)

 Execute func after wait milliseconds elapsed since invocation.
 E.g. to exec something after receiving an input stream
 with immediate truthy exec immediately but when called before
 wait ms are done nothing happens. E.g. to not exec a user invoked
 action twice accidentally

#### fun.throttleNamed(name, wait, func)

 see comment in debounceNamed

#### fun.debounceNamed(name, wait, func, immediate)

 debounce is based on the identity of the function called. When you call the
 identical method using debounce, multiple calls that happen between the first
 invocation and wait time will only cause execution once. However, wrapping a
 function with debounce and then storing (to be able to call the exact same
 function again) it is a repeating task and unpractical when using anonymous
 methods. debounceNamed() automatically maps function to ids and removes the
 need for this housekeeping code.

#### fun.createQueue(id, workerFunc)

 can be overwritten by a function

#### queue.handleError(err)

 can be overwritten

#### fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 This functions helps when you have a long running computation that
 multiple call sites (independent from each other) depend on. This
 function does the houskeeping to start the long running computation
 just once and returns an object that allows to schedule callbacks
 once the workerFunc is done
 this is how it works:
 if id does not exist, workerFunc is called, otherwise ignored.
 workerFunc is expected to call thenDoFunc with arguments: error, arg1, ..., argN
 if called subsequently before workerFunc is done, the other thenDoFunc
 will "pile up" and called with the same arguments as the first
 thenDoFunc once workerFunc is done

#### fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 timeout

#### fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 init the store

#### fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 call worker, but delay so we can immediately return

#### fun.composeAsync()

 composes functions: fun.composeAsync(f,g,h)(arg1, arg2) =
   f(arg1, arg2, thenDo1) -> thenDo1(err, fResult)
 -> g(fResult, thenDo2) -> thenDo2(err, gResult) ->
 -> h(fResult, thenDo3) -> thenDo2(err, hResult)
 Example:

```js
fun.composeAsync(
function(a,b, thenDo) { thenDo(null, a+b); },
function(x, thenDo) { thenDo(x*4); })(3,2, function(err, result) { alert(result); });
```

#### fun.compose()

 composes functions: fun.compose(f,g,h)(arg1, arg2) = h(g(f(arg1, arg2)))
 Example:

```js
fun.compose(function(a,b) {return a+b}, function(x) {return x*4})(3,2)
```

#### fun.flip(f)

 swaps the first two args
 fun.flip(function(a, b, c) { return a + b + c; })(' World', 'Hello', '!')

#### fun.flip(f)

args

#### fun.waitFor(timeoutMs, waitTesterFunc, thenDo)

 wait for waitTesterFunc to return true, then run thenDo, passing
 failure/timout err as first parameter. A timout occurs after
 timeoutMs. During the wait period waitTesterFunc might be called
 multiple times

#### fun.getOriginal(func)

 get the original 'unwrapped' function, traversing as many wrappers as necessary.

#### fun.addToObject(f, obj, name)

 suppport for tracing

#### fun.binds(f, varMapping)

 convenience function

#### Closure()

 represents a function and its bound values

<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file object.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

### properties

 -=-=-=-=-=-
 properties
 -=-=-=-=-=-

#### obj.inspect(obj, options, depth)

 print function

#### obj.inspect(obj, options, depth)

 print "primitive"

#### obj.merge(objs)

 // if objs are arrays just concat them
 // if objs are real objs then merge propertdies

#### obj.valuesInPropertyHierarchy(obj, name)

 lookup all properties named name in the proto hierarchy of obj
 also uses Lively's class structure

#### obj.shortPrintStringOf(obj)

 primitive values

#### obj.shortPrintStringOf(obj)

 constructed objects

#### obj.shortPrintStringOf(obj)

 arrays or plain objects

#### Path>>normalizePath()

 FIXME: define normalization

#### Path>>watch(options)

 options: target, haltWhenChanged, uninstall, onGet, onSet, verbose

#### Path>>watch(options)

 observe slots, for debugging

#### Path>>debugFunctionWrapper(options)

 options = {target, [haltWhenChanged, showStack, verbose, uninstall]}

<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file events.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->



<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file messenger.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->



<--- -=-=-=-=-=-=-=-=-=-=-=-=- ---><!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->
<!--- in file worker.js --->
<!---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--->

### WorkerSetup

 code in worker setup is evaluated in the context of workers, it will get to
 workers in a stringified form(!)

### BrowserWorker

 setting up the worker messenger interface, this is how the worker
 should be communicated with

#### BrowserWorker.create(options)

 this function instantiates a browser worker object. We provide a
 messenger-based interface to the pure Worker. Please use create to get an
 improved interface to a worker

#### BrowserWorker.create(options)

 figure out where the other lang libs can be loaded from

#### BrowserWorker.create(options)

 This code is triggered in the UI process directly after the
 creation of the worker and sends the setup message to the worker
 for initializing it.

#### BrowserWorker.create(options)

 This code is run inside the worker and bootstraps the messenger
 interface. It also installs a console.log method since since this is not
 available by default.

#### NodejsWorker.create(options)

 figure out where the other lang libs can be loaded from
 if (!options.libLocation && !options.scriptsToLoad) {
   var workerScript = document.querySelector("script[src$=\"worker.js\"]");
   if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
   options.libLocation = workerScript.src.replace(/worker.js$/, '');
 }

#### NodejsWorker.workerSetupFunction()

 this code is run in the context of the worker process

#### NodejsWorker.workerSetupFunction()

 process.on('message', function(m) {
   debug && console.log('[WORKER] got message:', m);
   if (m.action === 'ping') process.send({action: 'pong', data: m});
   else if (m.action === 'close') close = true;
   else if (m.action === 'setup') setup(m.data);
   else console.error('[WORKER] unknown message: ', m);
 });

#### NodejsWorker.startWorker(options, thenDo)

 WorkerSetup.initBrowserGlobals,

#### worker.create(options)

runFunc, arg1, ... argN, thenDo
<!---API_GENERATED_END--->

## License

[MIT License](LICENSE)

### methods throttle and debounce in function.js

adapted from Underscore.js 1.3.3
© 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
Underscore is distributed under the MIT license.

### dateFormat in date.js

Date Format 1.2.3
© 2007-2009 Steven Levithan <stevenlevithan.com>
MIT license
Includes enhancements by Scott Trenda <scott.trenda.net>
and Kris Kowal <cixar.com/~kris.kowal/>

### serveral methods in object.js including `subclass()`

are inspired or derived from Prototype JavaScript framework, version 1.6.0_rc1
© 2005-2007 Sam Stephenson
Prototype is freely distributable under the terms of an MIT-style license.
For details, see the Prototype web site: http://www.prototypejs.org/
