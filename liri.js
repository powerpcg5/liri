 //////////////////////////////////////////////////////////////////////////////
 // liri.js
 // Node.js command-line utility for querying Bands in Town, Spotify, and OMDB
 //   APIs
 //
 // 1830 Friday, 21 Nisan 5779 (26 April 2019) [EDT] {18012}
 //
 // University of Richmond Coding Boot Camp run by Trilogy Education Services
 // Austin Kim
 //
 // Modified:
 //   2323 Saturday, 22 Nisan 5779 (27 April 2019) [EDT] {18013}
 //   0623 Sunday, 23 Nisan 5779 (28 April 2019) [EDT] {18014}
 //////////////////////////////////////////////////////////////////////////////

 // GLOBAL VARIABLES

const DoFile = 'random.txt'              // Default do file
const LogFile = 'log.txt'
const DefaultSong = 'The Sign'           // Default song for `spotify-this-song'
const DefaultMovie = 'Mr. Nobody'        // Default movie for `movie-this'

 // Imports
var fs = require('fs')                   // Core _fs_ Node.js module
var axios = require('axios')             // Axios module
var moment = require('moment')           // Moment.js module
require('dotenv').config()               // Read Spotify API keys into env vars
var keys = require('./keys.js')          // Import keys from environment var's
var Spotify = require('node-spotify-api')// Spotify Node.js module
var spotify = new Spotify(keys.spotify)

 // Supported commands
const Commands = ['concert-this', 'spotify-this-song', 'movie-this',
  'do-what-it-says']

 // List of Liri commands to execute
var commandList = []
var index = 0                           // Ind. of next Liri command to execute

 // FUNCTIONS

 // getCommand(input):  Return the first command in _commands_ whose initial
 //   characters match those of _input_; otherwise return ''
function getCommand(input) {
  if (input.length === 0) return ''
  for (let i = 0; i !== Commands.length; ++i)
    if (Commands[i].length >= input.length &&
      input === Commands[i].substring(0, input.length)) return Commands[i]
  return ''}

 // parseCommand(command):  Parse a Liri command, returning a command object of
 //   the form:  {cmd: liri-command, arg: argument}
function parseCommand(command) {
  command = command.trim()
 // Get cmd
  var cmd = ''
  var i = 0
  while (i !== command.length && command.charAt(i) !== ',' && command.charAt(i)
    !== ' ' && command.charAt(i) !== '\t') cmd += command.charAt(i++)
 // Skip over commas and spaces
  while (i !== command.length && (command.charAt(i) === ',' ||
    command.charAt(i) === ' ' || command.charAt(i) === '\t')) ++i
 // Get any delimiter (single or double quote)
  var arg = ''
  var delimiter = ''
  if (i !== command.length) {
    if (command.charAt(i) === "'" || command.charAt(i) === '"')
      delimiter = command.charAt(i++)
    while (i !== command.length && command.charAt(i) !== delimiter)
      arg += command.charAt(i++)}
  return {cmd: getCommand(cmd), arg}
  }

 // displayUsage():  Display command usage
function displayUsage() {
  console.log('Usage: node liri concert-this <artist or band name>')
  console.log('       node liri spotify-this-song <song name>')
  console.log('       node liri movie-this <movie name>')
  console.log('       node liri do-what-it-says <command file>')
  return}

 // getCommandList():  Get list of Liri commands to execute
function getCommandList() {
  var args = process.argv.slice(2).join(' ')
  if (args.length === 0) {
    displayUsage()
    return}
  var command = parseCommand(args)
  if (command.cmd.length === 0) {
    displayUsage()
    return}
  if (command.cmd === 'do-what-it-says') getCommandListFromFile(command.arg)
    else if (command.arg.length !== 0) {
      commandList.push(command)
      executeCommandList()}
      else if (command.cmd === 'spotify-this-song') {
        command.arg = DefaultSong
        commandList.push(command)
        executeCommandList()}
        else if (command.cmd === 'movie-this') {
          command.arg = DefaultMovie
          commandList.push(command)
          executeCommandList()}
          else displayUsage()
  return}

 // getCommandListFromFile(filename):  Get list of Liri commands from filename
function getCommandListFromFile(filename) {
  var file, dataArray
  if (filename.length === 0) file = DoFile
    else file = filename
  fs.readFile(file, 'utf8', function(error, data) {
    if (error) {
      console.log(`liri:  Cannot open ‘${file}’ for reading.`)
      return}
    dataArray = data.split('\n')
    for (let cmd of dataArray) {
      var command = parseCommand(cmd)
      if (command.cmd.length !== 0 && command.cmd !== 'do-what-it-says')
        if (command.arg.length !== 0) commandList.push(command)
          else if (command.cmd === 'spotify-this-song') {
            command.arg = DefaultSong
            commandList.push(command)}
            else if (command.cmd === 'movie-this') {
              command.arg = DefaultMovie
              commandList.push(command)}
      } // for
    if (commandList.length >= 1) executeCommandList()
    return}) // function(error, data)
  return}

 // executeCommandList():  Execute next command in list of Liri commands
function executeCommandList() {
  if (index === commandList.length) return
  var command = commandList[index]
  switch (command.cmd) {
    case 'concert-this':
      concertThis(command.arg)           // Search Bands in Town API
      return
    case 'spotify-this-song':
      spotifyThisSong(command.arg)       // Search Spotify API
      return
    case 'movie-this':
      movieThis(command.arg)             // Search OMDB API
      }
  return}

 // number(n):  Return `n.  ' or `nn. ' (four characters minimum)
function number(n) {
  if (n < 10) return `${n}.  `
    else return `${n}. `}

 // concertThis(arg):  Search Bands in Town API
function concertThis(arg) {
  var results = '-'.repeat(8) + `Query:  concert-this ‘${arg}’`
  results += '-'.repeat(Math.max(process.stdout.columns - results.length, 0))
  axios.get(`https://rest.bandsintown.com/artists/${arg.replace(' ', '+')}` +
    `/events?app_id=codingbootcamp`)
    .then(function(response) {           // Promise
      if (response.data.length !== 0 && typeof response.data !== 'string')
        for (let num = 0; num !== response.data.length; ++num) {
          results += '\n' + number(num + 1) + 'Date:  ' +
            moment(response.data[num].datetime).format('M/D/Y')
          results += '\n        Venue:  ' + response.data[num].venue.name
          results += '\n        Location:  ' + response.data[num].venue.city +
            ', ' + response.data[num].venue.country}
        else results += '\n[No match]'
      console.log(results)
      appendLog(results)}
      ) // .then(function(response) ...
    .catch(function(error) {
      if (error.response) {              // Status code is outside of 200 range
        console.log(`Error response data:  ${error.response.data}`)
        console.log(`Error response status:  ${error.response.status}`)
        console.log(`Error response headers:  ${error.response.headers}`)}
        else if (error.request)          // No response was received
          console.log(`Error request:  ${error.request}`)
          else console.log(`Error:  ${error.message}`)
      console.log(`Error config:  ${error.config}`)
      console.log(results)
      appendLog(results)}
      ) // .catch(function(error) ...
  return}

 // spotifyThisSong(arg):  Search Spotify API
function spotifyThisSong(arg) {
  var results = '-'.repeat(8) + `Query:  spotify-this ‘${arg}’`
  results += '-'.repeat(Math.max(process.stdout.columns - results.length, 0))
  spotify.search({type: 'track', query: arg})
    .then(function(response) {           // Promise
      if (response.tracks.items && response.tracks.items.length >= 1)
        for (let num = 0; num !== response.tracks.items.length; ++num) {
          results += '\n' + number(num + 1) + '“' +
            response.tracks.items[num].name + '”'
          results += '\n        Artist:  '
          for (let i = 0; i !== response.tracks.items[num].artists.length; ++i)
            if (i === 0) results += response.tracks.items[num].artists[0].name
              else results += ', ' + response.tracks.items[num].artists[i].name
          results += '\n        Album:  _' +
            response.tracks.items[num].album.name + '_'
          results += '\n        Preview URL:  ' +
            response.tracks.items[num].preview_url}
        else results += '\n[No match]'
      console.log(results)
      appendLog(results)}
      ) // .then(function(response) ...
    .catch(function(err) {
      console.log('Spotify API error:  ' + err)
      console.log(results)
      appendLog(results)}
      ) // .catch(function(err) ...
  return}

 // movieThis(arg):  Search OMDB API
function movieThis(arg) {
  var results = '-'.repeat(8) + `Query:  movie-this ‘${arg}’`
  results += '-'.repeat(Math.max(process.stdout.columns - results.length, 0))
  axios.get(`https://www.omdbapi.com/?apikey=trilogy&t=${arg.replace(' ',
    '+')}`)
    .then(function(response) {           // Promise
      if (response.data.Response === 'True') {
        results += '\n' + 'Title:  _' + response.data.Title + '_'
        results += '\n' + 'Year:  ' + response.data.Year
        results += '\n' + 'IMDB rating:  ' + response.data.imdbRating
        for (let rating of response.data.Ratings)
          if (rating.Source === 'Rotten Tomatoes')
            results += '\n' + 'Rotten Tomatoes rating:  ' + rating.Value
        results += '\n' + 'Country:  ' + response.data.Country
        results += '\n' + 'Language(s):  ' + response.data.Language
        results += '\n' + 'Plot:  ' + response.data.Plot
        results += '\n' + 'Actors:  ' + response.data.Actors}
        else results += '\n[No match]'
      console.log(results)
      appendLog(results)}
      ) // .then(function(response) ...
    .catch(function(error) {
      if (error.response) {              // Status code is outside of 200 range
        console.log(`Error response data:  ${error.response.data}`)
        console.log(`Error response status:  ${error.response.status}`)
        console.log(`Error response headers:  ${error.response.headers}`)}
        else if (error.request)          // No response was received
          console.log(`Error request:  ${error.request}`)
          else console.log(`Error:  ${error.message}`)
      console.log(`Error config:  ${error.config}`)
      console.log(results)
      appendLog(results)}
      ) // .catch(function(error) ...
  return}

 // appendLog(results):  Append results to log file
function appendLog(results) {
  fs.appendFile(LogFile, results + '\n', function(err) {
    if (err) console.log(`liri:  Cannot open ‘${LogFile}’ for writing.`)
    ++index
    executeCommandList()
    return})
  return}

 // Start
getCommandList()
