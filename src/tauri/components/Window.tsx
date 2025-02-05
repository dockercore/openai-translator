import { useCallback, useEffect } from 'react'
import { getCurrent } from '@tauri-apps/api/window'
import { useTheme } from '../../common/hooks/useTheme'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Client as Styletron } from 'styletron-engine-atomic'
import { PREFIX } from '../../common/constants'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../../common/components/ErrorFallback'
import '../../common/i18n.js'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../common/hooks/useSettings'
import { IThemedStyleProps } from '../../common/types'
import { createUseStyles } from 'react-jss'
import { invoke } from '@tauri-apps/api/primitives'
import { open } from '@tauri-apps/plugin-shell'
import { usePinned } from '../../common/hooks/usePinned'

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

export interface IWindowProps {
    isTranslatorWindow?: boolean
    windowsTitlebarDisableDarkMode?: boolean
    children: React.ReactNode
}

export function Window(props: IWindowProps) {
    const { theme } = useTheme()
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StyletronProvider value={engine}>
                <BaseProvider theme={theme}>
                    <InnerWindow {...props} />
                </BaseProvider>
            </StyletronProvider>
        </ErrorBoundary>
    )
}

const useStyles = createUseStyles({
    titlebar: () => ({
        height: '30px',
        background: 'transparent',
        userSelect: 'none',
        display: 'flex',
        justifyContent: 'flex-end',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
    }),
    titlebarButton: (props: IThemedStyleProps & { windowsTitlebarDisableDarkMode?: boolean }) => ({
        'display': 'inline-flex',
        'justifyContent': 'center',
        'alignItems': 'center',
        'width': '30px',
        'height': '30px',
        '&:hover': {
            background:
                props.windowsTitlebarDisableDarkMode !== true && props.themeType === 'dark' ? '#353535' : '#e9e9e9',
        },
    }),
})

export function InnerWindow(props: IWindowProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType, windowsTitlebarDisableDarkMode: props.windowsTitlebarDisableDarkMode })
    const isMacOS = navigator.userAgent.includes('Mac OS X')
    const isWindows = navigator.userAgent.includes('Windows')
    const { pinned, setPinned } = usePinned()
    const { i18n } = useTranslation()
    const { settings } = useSettings()

    useEffect(() => {
        if (!props.isTranslatorWindow) {
            return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoke('get_translator_window_always_on_top').then((pinned: any) => {
            return setPinned(pinned)
        })
    }, [props.isTranslatorWindow, setPinned])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (settings?.i18n !== (i18n as any).language) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(i18n as any).changeLanguage(settings?.i18n)
        }
    }, [i18n, settings])

    const handlePin = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            const appWindow = getCurrent()
            setPinned((prev) => {
                const isPinned_ = !prev
                appWindow.setAlwaysOnTop(isPinned_)
                return isPinned_
            })
        },
        [setPinned]
    )

    const handleMinimize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const appWindow = getCurrent()
        appWindow.minimize()
    }, [])

    const handleMaximize = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const appWindow = getCurrent()
        const isMaximized = await appWindow.isMaximized()
        if (isMaximized) {
            await appWindow.unmaximize()
        } else {
            await appWindow.maximize()
        }
    }, [])

    const handleClose = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const appWindow = getCurrent()
        appWindow.hide()
    }, [])

    let svgPathColor = theme.colors.contentSecondary

    if (props.windowsTitlebarDisableDarkMode) {
        svgPathColor = '#555'
    }

    return (
        <div
            style={{
                position: 'relative',
                background: theme.colors.backgroundPrimary,
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                minHeight: '100vh',
            }}
            onClick={(e) => {
                // if e.target is a
                if ((e.target as HTMLElement).tagName === 'A') {
                    const href = (e.target as HTMLAnchorElement).href
                    if (href && href.startsWith('http')) {
                        e.preventDefault()
                        e.stopPropagation()
                        open(href)
                    }
                }
            }}
        >
            <div className={styles.titlebar} data-tauri-drag-region>
                {isMacOS && (
                    <>
                        <div className={styles.titlebarButton} onClick={handlePin}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 28 28'>
                                {pinned ? (
                                    <path
                                        fill={svgPathColor}
                                        fillRule='evenodd'
                                        d='M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3z'
                                    />
                                ) : (
                                    <path
                                        fill={svgPathColor}
                                        d='M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z'
                                    />
                                )}
                            </svg>
                        </div>
                    </>
                )}
                {isWindows && (
                    <>
                        <div className={styles.titlebarButton} onClick={handlePin}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                {pinned ? (
                                    <path
                                        fill={svgPathColor}
                                        fillRule='evenodd'
                                        d='M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3z'
                                    />
                                ) : (
                                    <path
                                        fill={svgPathColor}
                                        d='M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z'
                                    />
                                )}
                            </svg>
                        </div>
                        <div className={styles.titlebarButton} onClick={handleMinimize}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path fill={svgPathColor} d='M20 14H4v-4h16' />
                            </svg>
                        </div>
                        <div className={styles.titlebarButton} onClick={handleMaximize}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path fill={svgPathColor} d='M4 4h16v16H4V4m2 4v10h12V8H6Z' />
                            </svg>
                        </div>
                        <div className={styles.titlebarButton} onClick={handleClose}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path
                                    fill={svgPathColor}
                                    d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z'
                                />
                            </svg>
                        </div>
                    </>
                )}
            </div>
            {props.children}
        </div>
    )
}
