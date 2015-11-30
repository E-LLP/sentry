"""
sentry.runner
~~~~~~~~~~~~~

:copyright: (c) 2015 by the Sentry Team, see AUTHORS for more details.
:license: BSD, see LICENSE for more details.
"""
from __future__ import absolute_import, print_function

import os
import click


@click.group()
@click.option(
    '--config',
    default='~/.sentry',
    envvar='SENTRY_CONF',
    help='Path to configuration files.',
    metavar='PATH')
@click.version_option()
@click.pass_context
def cli(ctx, config):
    "Sentry is cross-platform crash reporting built with love."
    ctx.obj['config'] = config


# TODO(mattrobenolt): Autodiscover commands?
from .commands.init import init
cli.add_command(init)

from .commands.start import start
cli.add_command(start)

from .commands.help import help
cli.add_command(help)

from .commands.repair import repair
cli.add_command(repair)

from .commands.django import django
cli.add_command(django)

from .commands.cleanup import cleanup
cli.add_command(cleanup)

from .commands.upgrade import upgrade
cli.add_command(upgrade)

from .commands.backup import import_, export
cli.add_command(import_)
cli.add_command(export)

from .commands.createuser import createuser
cli.add_command(createuser)


def make_django_command(name, django_command=None, help=None):
    "A wrapper to convert a Django subcommand a Click command"
    if django_command is None:
        django_command = name

    @click.command(
        name=name,
        help=help,
        add_help_option=False,
        context_settings=dict(
            ignore_unknown_options=True,
        ))
    @click.argument('management_args', nargs=-1, type=click.UNPROCESSED)
    @click.pass_context
    def inner(ctx, management_args):
        ctx.params['management_args'] = (django_command,) + management_args
        ctx.forward(django)

    return inner


map(cli.add_command, (
    make_django_command('devserver', 'runserver', help='Start a light Web server for development.'),
    make_django_command('shell', help='Run a Python interactive interpreter.'),
    make_django_command('celery'),
))


def configure():
    """
    Kick things off and configure all the things.

    A guess is made as to whether the entrypoint is coming from Click
    or from another invocation of `configure()`. If Click, we're able
    to pass along the Click context object.
    """
    from .settings import discover_configs, configure
    try:
        ctx = click.get_current_context()
    except RuntimeError:
        ctx = None
    _, py, yaml = discover_configs(ctx)
    configure(ctx, py, yaml)


def get_prog():
    """
    Extract the proper program executable.

    In the case of `python -m sentry`, we want to detect this and
    make sure we return something useful rather than __main__.py
    """
    import sys
    try:
        if os.path.basename(sys.argv[0]) in ('__main__.py', '-c'):
            return '%s -m sentry' % sys.executable
    except (AttributeError, TypeError, IndexError):
        pass
    return 'sentry'


def main():
    cli(prog_name=get_prog(), obj={}, max_content_width=100)
